import { computed, ref } from 'vue'
import { ensureCourseStructure, recalculateUserPoints } from '../utils/srs'
import { createId } from '../utils/id'
import { applySnapshotToStudentCourse, getSharedCourse, mapSnapshotToCourse, syncSharedCoursesForUser } from '../utils/share'

const STORAGE_KEY = 'digisrs_users_v1'
const SESSION_KEY = 'digisrs_session_v1'

export const SECRET_QUESTIONS = [
  'What was your favourite childhood book?',
  'What is the name of your first teacher?',
  'Where would you go on your dream trip?',
  'What is your favourite word in any language?',
  'Who was your childhood hero?',
  'What song always lifts your mood?',
  'What is the name of the street you grew up on?',
  'What was the nickname of your first pet?'
]

const hasWindow = typeof window !== 'undefined'
const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined'

function normaliseUser(user) {
  if (!user) {
    return user
  }
  user.id = user.id || createId()
  user.email = (user.email || '').toLowerCase().trim()
  user.displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Learner')
  user.secretQuestion = user.secretQuestion || SECRET_QUESTIONS[0]
  user.secretAnswerHash = user.secretAnswerHash || ''
  user.passwordHash = user.passwordHash || ''
  user.createdAt = user.createdAt || new Date().toISOString()
  user.lastLogin = user.lastLogin || null
  user.preferences = user.preferences || {}
  user.preferences.workspaceMode = user.preferences.workspaceMode || 'creator'
  user.preferences.audioEnabled = user.preferences.audioEnabled !== false
  user.integrations = user.integrations || {}
  const elevenLabs = user.integrations.elevenLabs || {}
  user.integrations.elevenLabs = {
    apiKey: elevenLabs.apiKey || '',
    voiceId: elevenLabs.voiceId || '21m00Tcm4TlvDq8ikWAM',
    modelId: elevenLabs.modelId || 'eleven_multilingual_v2',
    outputFormat: elevenLabs.outputFormat || 'mp3_44100_128'
  }
  user.courses = Array.isArray(user.courses) ? user.courses : []
  user.courses = user.courses.map(course => {
    const hydrated = ensureCourseStructure(course)
    hydrated.id = hydrated.id || createId()
    hydrated.role = hydrated.role || 'creator'
    hydrated.title = hydrated.title || 'Untitled course'
    hydrated.description = hydrated.description || ''
    hydrated.createdAt = hydrated.createdAt || new Date().toISOString()
    if (hydrated.role === 'student' && hydrated.sourceShareCode) {
      const snapshot = getSharedCourse(hydrated.sourceShareCode)
      if (snapshot && snapshot.updatedAt !== hydrated.lastSyncedAt) {
        applySnapshotToStudentCourse(hydrated, snapshot)
      }
      return ensureCourseStructure(hydrated)
    }
    return hydrated
  })
  recalculateUserPoints(user)
  syncSharedCoursesForUser(user)
  return user
}

function loadUsers() {
  if (!hasLocalStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.map(user => normaliseUser(user))
  } catch (error) {
    console.warn('Unable to read saved users', error)
    return []
  }
}

const users = ref(loadUsers())
const sessionId = ref(hasLocalStorage ? window.localStorage.getItem(SESSION_KEY) : null)

export const currentUser = computed(() => {
  const id = sessionId.value
  if (!id) {
    return null
  }
  return users.value.find(user => user.id === id) || null
})

function persistUsers() {
  if (hasLocalStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users.value))
  }
}

function setSession(id) {
  sessionId.value = id
  if (hasLocalStorage) {
    if (id) {
      window.localStorage.setItem(SESSION_KEY, id)
    } else {
      window.localStorage.removeItem(SESSION_KEY)
    }
  }
}

async function hashString(value) {
  const text = String(value)
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (cryptoApi?.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await cryptoApi.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
  }
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index)
    hash |= 0
  }
  return hash.toString(16)
}

function replaceUserInCollection(user) {
  const index = users.value.findIndex(item => item.id === user.id)
  if (index !== -1) {
    users.value.splice(index, 1, user)
  }
}

export function useAuth() {
  async function register({ email, password, displayName, secretQuestion, secretAnswer }) {
    const normalisedEmail = (email || '').toLowerCase().trim()
    if (!normalisedEmail || !password) {
      throw new Error('Email and password are required.')
    }
    if (users.value.some(user => user.email === normalisedEmail)) {
      throw new Error('An account already exists for this email address.')
    }
    const passwordHash = await hashString(password)
    const answerHash = await hashString((secretAnswer || '').toLowerCase().trim())
    const user = normaliseUser({
      id: createId(),
      email: normalisedEmail,
      passwordHash,
      displayName: displayName?.trim() || normalisedEmail.split('@')[0],
      secretQuestion: secretQuestion || SECRET_QUESTIONS[0],
      secretAnswerHash: answerHash,
      courses: [],
      points: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    })
    users.value.push(user)
    setSession(user.id)
    persistUsers()
    return user
  }

  async function login(email, password) {
    const normalisedEmail = (email || '').toLowerCase().trim()
    const user = users.value.find(item => item.email === normalisedEmail)
    if (!user) {
      throw new Error('No account matches this email address.')
    }
    const passwordHash = await hashString(password)
    if (passwordHash !== user.passwordHash) {
      throw new Error('Incorrect password. Please try again.')
    }
    user.lastLogin = new Date().toISOString()
    replaceUserInCollection(user)
    setSession(user.id)
    persistUsers()
    return user
  }

  function logout() {
    setSession(null)
  }

  function getSecretQuestion(email) {
    const normalisedEmail = (email || '').toLowerCase().trim()
    const user = users.value.find(item => item.email === normalisedEmail)
    if (!user) {
      throw new Error('We could not find an account with that email address.')
    }
    return user.secretQuestion
  }

  async function resetPassword(email, answer, newPassword) {
    const normalisedEmail = (email || '').toLowerCase().trim()
    const user = users.value.find(item => item.email === normalisedEmail)
    if (!user) {
      throw new Error('We could not find an account with that email address.')
    }
    const answerHash = await hashString((answer || '').toLowerCase().trim())
    if (answerHash !== user.secretAnswerHash) {
      throw new Error('The secret answer is incorrect.')
    }
    user.passwordHash = await hashString(newPassword)
    replaceUserInCollection(user)
    persistUsers()
    return true
  }

  function updateCurrentUser(mutator) {
    const user = currentUser.value
    if (!user) {
      throw new Error('No active user session.')
    }
    mutator(user)
    normaliseUser(user)
    replaceUserInCollection(user)
    persistUsers()
    return user
  }

  function isAuthenticated() {
    return Boolean(currentUser.value)
  }

  function setWorkspaceMode(mode) {
    const allowed = ['creator', 'student']
    updateCurrentUser(user => {
      user.preferences.workspaceMode = allowed.includes(mode) ? mode : 'creator'
    })
  }

  function saveElevenLabsSettings(settings) {
    updateCurrentUser(user => {
      user.integrations.elevenLabs = {
        ...user.integrations.elevenLabs,
        ...settings
      }
    })
  }

  function joinSharedCourse(shareCode) {
    const trimmed = (shareCode || '').trim()
    if (!trimmed) {
      throw new Error('A course code or link is required.')
    }
    const codeMatch = trimmed.match(/([a-z0-9-]{6,})$/i)
    const code = codeMatch ? codeMatch[1] : trimmed
    const snapshot = getSharedCourse(code)
    if (!snapshot) {
      throw new Error('We could not find a shared course for this code.')
    }
    let joinedCourse = null
    updateCurrentUser(user => {
      const existing = user.courses.find(course => course.role === 'student' && course.sourceShareCode === snapshot.shareCode)
      if (existing) {
        applySnapshotToStudentCourse(existing, snapshot)
        joinedCourse = existing
        return
      }
      const mapped = mapSnapshotToCourse(snapshot)
      user.courses.push(mapped)
      joinedCourse = mapped
    })
    return joinedCourse
  }

  return {
    currentUser,
    register,
    login,
    logout,
    getSecretQuestion,
    resetPassword,
    updateCurrentUser,
    isAuthenticated,
    persistUsers,
    secretQuestions: SECRET_QUESTIONS,
    setWorkspaceMode,
    saveElevenLabsSettings,
    joinSharedCourse
  }
}

export function isAuthenticated() {
  return Boolean(currentUser.value)
}

export function refreshUsersFromStorage() {
  users.value = loadUsers()
}

