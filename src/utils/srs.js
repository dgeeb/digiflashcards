import { createId } from './id'

const DAY_IN_MS = 86400000
const LEARNING_STEPS = [0, 1, 3, 7]
export const DAILY_LIMITS = {
  newCards: 15,
  reviewCards: 50,
  studyTimeMinutes: 25
}
const MAX_INTERVAL_DAYS = 180
const MIN_INTERVAL_DAYS = 1

export const REVIEW_SHORTCUTS = [
  {
    value: 1,
    key: 'very',
    label: 'I know it very well',
    description: 'Push this card far into the future.',
    shortcut: '1',
    color: '#10b981'
  },
  {
    value: 2,
    key: 'well',
    label: 'I know it well',
    description: 'Schedule it for a comfortable review soon.',
    shortcut: '2',
    color: '#3b82f6'
  },
  {
    value: 3,
    key: 'uncertain',
    label: "I don't know it well",
    description: 'Keep it in the short-term loop.',
    shortcut: '3',
    color: '#f59e0b'
  },
  {
    value: 4,
    key: 'forgot',
    label: "I don't know it at all",
    description: 'See it again almost immediately.',
    shortcut: '4',
    color: '#ef4444'
  }
]

const RATING_POINTS = {
  easy: 15,
  good: 10,
  hard: 4,
  again: 1
}

const ratingMap = {
  1: 'easy',
  2: 'good',
  3: 'hard',
  4: 'again'
}

function normaliseAudioClip(clip, side) {
  if (!clip) {
    return null
  }
  const dataUrl = clip.dataUrl || clip.url || ''
  if (!dataUrl) {
    return null
  }
  return {
    id: clip.id || createId(),
    dataUrl,
    url: clip.url || dataUrl,
    mimeType: clip.mimeType || 'audio/mpeg',
    source: clip.source || 'upload',
    textSource: side,
    createdAt: clip.createdAt || new Date().toISOString()
  }
}

function ensureCardAudio(card) {
  if (!card) {
    return
  }
  const audio = card.audio
  let front = null
  let back = null
  if (audio && typeof audio === 'object' && ('front' in audio || 'back' in audio)) {
    front = normaliseAudioClip(audio.front, 'front')
    back = normaliseAudioClip(audio.back, 'back')
  } else if (audio && typeof audio === 'object' && (audio.dataUrl || audio.url)) {
    const side = (audio.textSource || card.audioSide || 'front').toLowerCase()
    const clip = normaliseAudioClip(audio, side === 'back' ? 'back' : 'front')
    if (side === 'back') {
      back = clip
    } else {
      front = clip
    }
  }
  card.audio = front || back ? { front, back } : null
  if (!card.audio) {
    card.audioSide = 'none'
  } else if (card.audio.front && card.audio.back) {
    card.audioSide = 'both'
  } else if (card.audio.front) {
    card.audioSide = 'front'
  } else if (card.audio.back) {
    card.audioSide = 'back'
  }
}

function ensureDailyProgress(stage) {
  if (!stage) {
    return { date: null, new: 0, review: 0 }
  }
  const today = new Date().toISOString().slice(0, 10)
  const progress = stage.dailyProgress && typeof stage.dailyProgress === 'object' ? stage.dailyProgress : {}
  if (progress.date !== today) {
    stage.dailyProgress = { date: today, new: 0, review: 0 }
  } else {
    stage.dailyProgress = {
      date: progress.date,
      new: typeof progress.new === 'number' ? progress.new : 0,
      review: typeof progress.review === 'number' ? progress.review : 0
    }
  }
  return stage.dailyProgress
}

function ensureCardShape(card) {
  if (!card) {
    return
  }
  card.history = Array.isArray(card.history) ? card.history : []
  card.easeFactor = typeof card.easeFactor === 'number' ? card.easeFactor : 2.5
  card.intervalDays = typeof card.intervalDays === 'number' ? card.intervalDays : 0
  card.status = card.status || 'new'
  card.mastery = typeof card.mastery === 'number' ? card.mastery : 0
  card.learningStep = typeof card.learningStep === 'number' ? card.learningStep : 0
  card.lapseCount = typeof card.lapseCount === 'number' ? card.lapseCount : 0
  card.repetitions = typeof card.repetitions === 'number' ? card.repetitions : 0
  ensureCardAudio(card)
}

export function ensureStageStructure(stage) {
  if (!stage) {
    return stage
  }
  stage.cards = Array.isArray(stage.cards) ? stage.cards : []
  stage.points = typeof stage.points === 'number' ? stage.points : 0
  stage.metrics = computeStageMetrics(stage)
  ensureDailyProgress(stage)
  stage.cards.forEach(ensureCardShape)
  return stage
}

export function ensureCourseStructure(course) {
  if (!course) {
    return course
  }
  course.role = course.role || 'creator'
  if (course.role !== 'student') {
    course.shareCode = course.shareCode || null
  }
  course.points = typeof course.points === 'number' ? course.points : 0
  course.stages = Array.isArray(course.stages) ? course.stages : []
  course.stages = course.stages.map(ensureStageStructure)
  return course
}

export function scheduleCard(card, gradeValue) {
  ensureCardShape(card)
  const rating = ratingMap[gradeValue] || 'again'
  const now = Date.now()
  const currentStep = typeof card.learningStep === 'number' ? card.learningStep : 0
  const wasNew = card.status === 'new' || currentStep < LEARNING_STEPS.length
  const previousInterval = typeof card.intervalDays === 'number' ? card.intervalDays : 0
  let interval = MIN_INTERVAL_DAYS
  let requeue = false

  if (rating === 'again') {
    if (previousInterval >= 7) {
      card.lapseCount = (card.lapseCount || 0) + 1
    }
    const fallbackStep = currentStep <= 0 ? 0 : 1
    card.learningStep = Math.max(0, Math.min(fallbackStep, LEARNING_STEPS.length - 1))
    interval = 1
    card.status = 'relearning'
    card.repetitions = 0
    requeue = true
  } else if (currentStep < LEARNING_STEPS.length) {
    const stepIndex = Math.max(0, Math.min(currentStep, LEARNING_STEPS.length - 1))
    interval = LEARNING_STEPS[stepIndex]
    requeue = interval === 0
    const advance = rating === 'easy' ? 2 : rating === 'good' ? 1 : 0
    card.learningStep = Math.min(stepIndex + Math.max(advance, 0), LEARNING_STEPS.length)
    if (!requeue && interval < MIN_INTERVAL_DAYS) {
      interval = MIN_INTERVAL_DAYS
    }
    card.status = card.learningStep >= LEARNING_STEPS.length ? 'review' : 'learning'
    if (card.status === 'review') {
      interval = Math.max(interval, LEARNING_STEPS[LEARNING_STEPS.length - 1])
    }
  } else {
    const base = Math.max(previousInterval || MIN_INTERVAL_DAYS, MIN_INTERVAL_DAYS)
    const multiplier = rating === 'easy' ? 2.5 : rating === 'good' ? 2.0 : 1.2
    interval = Math.round(base * multiplier)
    interval = Math.max(MIN_INTERVAL_DAYS, Math.min(MAX_INTERVAL_DAYS, interval))
    card.learningStep = LEARNING_STEPS.length
    card.status = 'review'
  }

  const ease = (() => {
    const current = typeof card.easeFactor === 'number' ? card.easeFactor : 2.5
    if (rating === 'again') {
      return Math.max(1.3, current - 0.2)
    }
    if (rating === 'hard') {
      return Math.max(1.3, current - 0.05)
    }
    if (rating === 'good') {
      return Math.max(1.3, current + 0.05)
    }
    return Math.max(1.3, current + 0.15)
  })()

  const masteryDelta = rating === 'easy' ? 6 : rating === 'good' ? 4 : rating === 'hard' ? 1 : -6
  const dueTimestamp = now + interval * DAY_IN_MS
  card.easeFactor = ease
  card.intervalDays = interval
  card.due = new Date(dueTimestamp).toISOString()
  card.lastReviewed = new Date(now).toISOString()
  card.mastery = Math.max(0, Math.min(100, (card.mastery || 0) + masteryDelta))
  card.repetitions = rating === 'again' ? 0 : (card.repetitions || 0) + 1
  card.history.unshift({
    grade: rating,
    numericGrade: gradeValue,
    timestamp: card.lastReviewed,
    intervalDays: interval
  })
  if (card.history.length > 100) {
    card.history.length = 100
  }
  return {
    due: card.due,
    intervalDays: interval,
    easeFactor: ease,
    points: RATING_POINTS[rating] || RATING_POINTS.again,
    requeue,
    rating,
    studyType: wasNew ? 'new' : 'review',
    lapsed: rating === 'again' && previousInterval >= 7
  }
}

export function computeStageMetrics(stage) {
  if (!stage) {
    return {
      total: 0,
      due: 0,
      newCards: 0,
      mastered: 0,
      learning: 0
    }
  }
  stage.cards = Array.isArray(stage.cards) ? stage.cards : []
  const now = Date.now()
  const metrics = {
    total: stage.cards.length,
    due: 0,
    newCards: 0,
    mastered: 0,
    learning: 0
  }
  stage.cards.forEach(card => {
    ensureCardShape(card)
    if (!card.due) {
      metrics.newCards += 1
    } else if (new Date(card.due).getTime() <= now) {
      metrics.due += 1
    }
    if ((card.mastery || 0) >= 60) {
      metrics.mastered += 1
    }
    if ((card.status === 'learning' || card.status === 'relearning' || card.status === 'new') && card.mastery < 60) {
      metrics.learning += 1
    }
  })
  stage.metrics = metrics
  return metrics
}

export function getDailyAllowances(stage, { newCards = DAILY_LIMITS.newCards, reviewCards = DAILY_LIMITS.reviewCards } = {}) {
  if (!stage) {
    return { new: newCards, review: reviewCards }
  }
  const progress = ensureDailyProgress(stage)
  return {
    new: Math.max(0, newCards - (progress.new || 0)),
    review: Math.max(0, reviewCards - (progress.review || 0))
  }
}

export function incrementDailyProgress(stage, type, delta = 1) {
  if (!stage || (type !== 'new' && type !== 'review')) {
    return
  }
  const progress = ensureDailyProgress(stage)
  progress[type] = Math.max(0, (progress[type] || 0) + delta)
  stage.dailyProgress = progress
}

export function buildSessionQueue(stage, { limitNew = DAILY_LIMITS.newCards, limitReview = DAILY_LIMITS.reviewCards } = {}) {
  if (!stage) {
    return []
  }
  ensureStageStructure(stage)
  const now = Date.now()
  const due = []
  const fresh = []
  stage.cards.forEach(card => {
    ensureCardShape(card)
    if (!card.due) {
      fresh.push(card)
    } else if (new Date(card.due).getTime() <= now) {
      due.push(card)
    }
  })
  due.sort((a, b) => {
    const aDue = a.due ? new Date(a.due).getTime() : 0
    const bDue = b.due ? new Date(b.due).getTime() : 0
    return aDue - bDue
  })
  const allowances = getDailyAllowances(stage, { newCards: limitNew, reviewCards: limitReview })
  const reviewCap = Math.min(limitReview, allowances.review)
  const newCap = Math.min(limitNew, allowances.new)
  const dueSelection = reviewCap > 0 ? due.slice(0, reviewCap) : []
  const newSelection = newCap > 0 ? fresh.slice(0, newCap) : []
  const queue = []
  let dueIndex = 0
  let newIndex = 0
  while (dueIndex < dueSelection.length || newIndex < newSelection.length) {
    if (dueIndex < dueSelection.length) {
      queue.push(dueSelection[dueIndex++])
    }
    if (newIndex < newSelection.length) {
      queue.push(newSelection[newIndex++])
    }
  }
  return queue
}

export function summariseDailyAssignments(courses) {
  const summary = {
    totalDue: 0,
    totalNew: 0,
    perStage: []
  }
  if (!Array.isArray(courses)) {
    return summary
  }
  const now = Date.now()
  courses.forEach(course => {
    if (!course || !Array.isArray(course.stages)) {
      return
    }
    course.stages.forEach(stage => {
      ensureStageStructure(stage)
      let due = 0
      let fresh = 0
      stage.cards.forEach(card => {
        ensureCardShape(card)
        if (!card.due) {
          fresh += 1
        } else if (new Date(card.due).getTime() <= now) {
          due += 1
        }
      })
      if (due > 0 || fresh > 0) {
        summary.perStage.push({
          courseId: course.id,
          courseTitle: course.title,
          stageId: stage.id,
          stageTitle: stage.title,
          due,
          fresh
        })
      }
      summary.totalDue += due
      summary.totalNew += fresh
    })
  })
  return summary
}

export function recalculateUserPoints(user) {
  if (!user) {
    return 0
  }
  let total = 0
  if (Array.isArray(user.courses)) {
    user.courses.forEach(course => {
      if (!course) {
        return
      }
      let coursePoints = 0
      if (Array.isArray(course.stages)) {
        course.stages.forEach(stage => {
          const stagePoints = typeof stage?.points === 'number' ? stage.points : 0
          coursePoints += stagePoints
        })
      }
      course.points = coursePoints
      total += coursePoints
    })
  }
  user.points = total
  return total
}

export function getGradeConfiguration() {
  return gradeConfiguration
}
