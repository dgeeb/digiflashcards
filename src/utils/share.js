import { createId } from './id'

const STORAGE_KEY = 'digisrs_shared_courses_v1'

const hasWindow = typeof window !== 'undefined'
const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined'

function readSharedCourses() {
  if (!hasLocalStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('Unable to read shared courses', error)
    return []
  }
}

function writeSharedCourses(courses) {
  if (!hasLocalStorage) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
  } catch (error) {
    console.warn('Unable to persist shared courses', error)
  }
}

function normaliseAudioSegment(segment, side) {
  if (!segment || typeof segment !== 'object') {
    return null
  }
  const dataUrl = segment.dataUrl || segment.url || ''
  if (!dataUrl) {
    return null
  }
  return {
    mimeType: segment.mimeType || 'audio/mpeg',
    dataUrl,
    source: segment.source || 'upload',
    textSource: side,
    createdAt: segment.createdAt || new Date().toISOString()
  }
}

function normaliseAudioPayload(audio) {
  if (!audio || typeof audio !== 'object') {
    return null
  }
  let front = null
  let back = null
  if (audio.front || audio.back) {
    front = normaliseAudioSegment(audio.front, 'front')
    back = normaliseAudioSegment(audio.back, 'back')
  } else if (audio.dataUrl || audio.url) {
    const side = (audio.textSource || audio.side) === 'back' ? 'back' : 'front'
    const segment = normaliseAudioSegment(audio, side)
    if (side === 'front') {
      front = segment
    } else {
      back = segment
    }
  }
  if (!front && !back) {
    return null
  }
  return { front, back }
}

function buildSnapshot(ownerId, ownerName, course, shareCode) {
  return {
    ownerId,
    courseId: course.id,
    shareCode,
    ownerName: ownerName || 'Course author',
    title: course.title,
    description: course.description,
    stages: Array.isArray(course.stages)
      ? course.stages.map(stage => ({
          id: stage.id,
          title: stage.title,
          description: stage.description,
          cards: Array.isArray(stage.cards)
            ? stage.cards.map(card => ({
                id: card.id,
                front: card.front,
                back: card.back,
                note: card.note,
                audio: normaliseAudioPayload(card.audio),
                audioSide: card.audioSide || card.audio_side || 'back'
              }))
            : []
        }))
      : [],
    updatedAt: new Date().toISOString()
  }
}

export function getSharedCourses() {
  return readSharedCourses()
}

export function getSharedCourse(shareCode) {
  if (!shareCode) {
    return null
  }
  const courses = readSharedCourses()
  return courses.find(item => item.shareCode === shareCode) ?? null
}

export function upsertSharedCourse(ownerId, ownerName, course) {
  if (!ownerId || !course) {
    return null
  }
  const shareCode = course.shareCode || createId()
  const snapshot = buildSnapshot(ownerId, ownerName, course, shareCode)
  const courses = readSharedCourses()
  const index = courses.findIndex(item => item.shareCode === shareCode)
  if (index === -1) {
    courses.push(snapshot)
  } else {
    courses.splice(index, 1, snapshot)
  }
  writeSharedCourses(courses)
  return shareCode
}

export function removeMissingOwnedSnapshots(ownerId, activeShareCodes) {
  const courses = readSharedCourses()
  const filtered = courses.filter(item => {
    if (item.ownerId !== ownerId) {
      return true
    }
    return activeShareCodes.has(item.shareCode)
  })
  if (filtered.length !== courses.length) {
    writeSharedCourses(filtered)
  }
}

export function mapSnapshotToCourse(snapshot) {
  if (!snapshot) {
    return null
  }
  return {
    id: createId(),
    role: 'student',
    title: snapshot.title,
    description: snapshot.description,
    createdAt: new Date().toISOString(),
    points: 0,
    ownerName: snapshot.ownerName || 'Course author',
    stages: snapshot.stages.map(stage => ({
      id: stage.id,
      title: stage.title,
      description: stage.description,
      points: 0,
      cards: stage.cards.map(card => ({
        id: card.id,
        front: card.front,
        back: card.back,
        note: card.note || '',
        audio: normaliseAudioPayload(card.audio),
        audioSide: card.audioSide || 'back',
        createdAt: new Date().toISOString(),
        status: 'new',
        history: [],
        mastery: 0,
        easeFactor: 2.5,
        intervalDays: 0,
        due: null
      })),
      metrics: {
        total: stage.cards.length,
        due: stage.cards.length,
        newCards: stage.cards.length,
        mastered: 0,
        learning: 0
      }
    })),
    shareCode: snapshot.shareCode,
    sourceShareCode: snapshot.shareCode,
    sourceCourseId: snapshot.courseId,
    lastSyncedAt: snapshot.updatedAt
  }
}

export function applySnapshotToStudentCourse(course, snapshot) {
  if (!course || !snapshot) {
    return
  }
  course.title = snapshot.title
  course.description = snapshot.description
  course.shareCode = snapshot.shareCode
  course.sourceShareCode = snapshot.shareCode
  course.sourceCourseId = snapshot.courseId
  course.lastSyncedAt = snapshot.updatedAt
  course.ownerName = snapshot.ownerName || course.ownerName
  const existingStages = new Map(Array.isArray(course.stages) ? course.stages.map(stage => [stage.id, stage]) : [])
  const nextStages = []
  snapshot.stages.forEach(stageSnapshot => {
    let stage = existingStages.get(stageSnapshot.id)
    if (!stage) {
      stage = {
        id: stageSnapshot.id,
        title: stageSnapshot.title,
        description: stageSnapshot.description,
        cards: [],
        points: 0,
        metrics: { total: 0, due: 0, newCards: 0, mastered: 0, learning: 0 }
      }
    } else {
      stage.title = stageSnapshot.title
      stage.description = stageSnapshot.description
    }
    const existingCards = new Map(stage.cards.map(card => [card.id, card]))
    const nextCards = []
    stageSnapshot.cards.forEach(cardSnapshot => {
      let card = existingCards.get(cardSnapshot.id)
      if (!card) {
        card = {
          id: cardSnapshot.id,
          front: cardSnapshot.front,
          back: cardSnapshot.back,
          note: cardSnapshot.note || '',
          audioSide: cardSnapshot.audioSide || 'back',
          createdAt: new Date().toISOString(),
          status: 'new',
          history: [],
          mastery: 0,
          easeFactor: 2.5,
          intervalDays: 0,
          due: null
        }
      } else {
        card.front = cardSnapshot.front
        card.back = cardSnapshot.back
        card.note = cardSnapshot.note || ''
      }
      card.audio = normaliseAudioPayload(cardSnapshot.audio)
      card.audioSide = cardSnapshot.audioSide || card.audioSide || 'back'
      nextCards.push(card)
    })
    stage.cards = nextCards
    nextStages.push(stage)
  })
  course.stages = nextStages
}

export function syncSharedCoursesForUser(user) {
  if (!user || !Array.isArray(user.courses)) {
    return
  }
  const activeCodes = new Set()
  user.courses
    .filter(course => course && course.role !== 'student')
    .forEach(course => {
      const code = upsertSharedCourse(user.id, user.displayName || 'Course author', course)
      if (code) {
        course.shareCode = code
        activeCodes.add(code)
      }
    })
  removeMissingOwnedSnapshots(user.id, activeCodes)
}

