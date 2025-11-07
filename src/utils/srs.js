import { createId } from './id'

const DAY_IN_MS = 86400000
const MAX_INTERVAL = 180
const MIN_INTERVAL = 1
const LEARNING_INTERVALS = [0, 1, 3, 7]

export const DAILY_LIMITS = {
  newCards: 15,
  reviewCards: 50,
  studyTimeMinutes: 25
}

export const REVIEW_SHORTCUTS = [
  {
    value: 1,
    rating: 'easy',
    key: 'easy',
    label: 'Easy',
    description: 'Instant recall · Interval ×2.5',
    shortcut: '1',
    color: '#10b981'
  },
  {
    value: 2,
    rating: 'good',
    key: 'good',
    label: 'Good',
    description: 'Remembered with effort · Interval ×2.0',
    shortcut: '2',
    color: '#3b82f6'
  },
  {
    value: 3,
    rating: 'hard',
    key: 'hard',
    label: 'Hard',
    description: 'Struggled · Interval ×1.2, short-term loop',
    shortcut: '3',
    color: '#f59e0b'
  },
  {
    value: 4,
    rating: 'again',
    key: 'again',
    label: 'Again',
    description: 'Forgotten · See again almost immediately',
    shortcut: '4',
    color: '#ef4444'
  }
]

const ratingMap = {
  1: 'easy',
  2: 'good',
  3: 'hard',
  4: 'again'
}

function normaliseAudioSegment(segment, side) {
  if (!segment || typeof segment !== 'object') {
    return null
  }
  const dataUrl = segment.dataUrl || segment.url || segment.src || ''
  if (!dataUrl) {
    return null
  }
  return {
    id: segment.id || createId(),
    dataUrl,
    mimeType: segment.mimeType || 'audio/mpeg',
    source: segment.source || 'upload',
    createdAt: segment.createdAt || new Date().toISOString(),
    side
  }
}

export function ensureCardShape(card) {
  if (!card) {
    return
  }
  card.id = card.id || createId()
  card.history = Array.isArray(card.history) ? card.history : []
  card.reviewCount = typeof card.reviewCount === 'number' ? card.reviewCount : 0
  card.successCount = typeof card.successCount === 'number' ? card.successCount : 0
  card.successRate = typeof card.successRate === 'number' ? card.successRate : (card.reviewCount ? card.successCount / card.reviewCount : 0)
  card.lapseCount = typeof card.lapseCount === 'number' ? card.lapseCount : 0
  card.learningStep = typeof card.learningStep === 'number' ? card.learningStep : 0
  card.easeFactor = typeof card.easeFactor === 'number' ? card.easeFactor : 2.2
  card.intervalDays = typeof card.intervalDays === 'number' ? card.intervalDays : 0
  card.lastInterval = typeof card.lastInterval === 'number' ? card.lastInterval : card.intervalDays
  card.status = card.status || 'new'
  card.createdAt = card.createdAt || new Date().toISOString()
  const rawAudio = card.audio
  const audioPayload = { front: null, back: null }
  if (rawAudio && typeof rawAudio === 'object') {
    if (rawAudio.front || rawAudio.back) {
      audioPayload.front = normaliseAudioSegment(rawAudio.front, 'front')
      audioPayload.back = normaliseAudioSegment(rawAudio.back, 'back')
    } else {
      const side = (rawAudio.textSource || rawAudio.side) === 'back' ? 'back' : 'front'
      audioPayload[side] = normaliseAudioSegment(rawAudio, side)
    }
  }
  card.audio = audioPayload
  const initialSide = String(card.audioSide || card.audio_side || '').toLowerCase()
  if (audioPayload.front && audioPayload.back) {
    card.audioSide = 'both'
  } else if (audioPayload.back) {
    card.audioSide = 'back'
  } else if (audioPayload.front) {
    card.audioSide = 'front'
  } else if (['front', 'back', 'both'].includes(initialSide)) {
    card.audioSide = initialSide
  } else {
    card.audioSide = 'back'
  }
  card.audio_side = card.audioSide
  card.mastery = typeof card.mastery === 'number' ? card.mastery : Math.round((card.successRate || 0) * 100)
  return card
}

export function ensureStageStructure(stage) {
  if (!stage) {
    return stage
  }
  stage.cards = Array.isArray(stage.cards) ? stage.cards : []
  stage.cards.forEach(ensureCardShape)
  stage.points = typeof stage.points === 'number' ? stage.points : 0
  stage.metrics = computeStageMetrics(stage)
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

function computePointsForRating(rating) {
  switch (rating) {
    case 'easy':
      return 15
    case 'good':
      return 10
    case 'hard':
      return 4
    default:
      return 1
  }
}

export function scheduleCard(card, gradeValue) {
  ensureCardShape(card)
  const rating = ratingMap[gradeValue] || 'again'
  const now = new Date()
  const previousInterval = card.intervalDays || MIN_INTERVAL
  let interval = previousInterval
  let ease = card.easeFactor || 2.2
  let requeue = false

  if (card.status === 'new') {
    card.status = 'learning'
  }

  if (rating === 'again') {
    card.learningStep = Math.max(0, card.learningStep - 1)
    interval = 1
    ease = Math.max(1.3, ease - 0.2)
    card.lapseCount += 1
    card.status = 'relearning'
    requeue = true
  } else if (card.status === 'learning' && card.learningStep < LEARNING_INTERVALS.length - 1) {
    const nextStep = Math.min(card.learningStep + 1, LEARNING_INTERVALS.length - 1)
    card.learningStep = nextStep
    interval = LEARNING_INTERVALS[nextStep] || 1
    requeue = nextStep <= 1 || rating === 'hard'
    if (nextStep >= LEARNING_INTERVALS.length - 1) {
      card.status = 'review'
    }
  } else {
    card.status = 'review'
    const currentInterval = Math.max(MIN_INTERVAL, previousInterval || 1)
    if (rating === 'hard') {
      interval = Math.max(MIN_INTERVAL, Math.ceil(currentInterval * 1.2))
      ease = Math.max(1.3, ease - 0.15)
      requeue = currentInterval < 3
    } else if (rating === 'good') {
      interval = Math.max(MIN_INTERVAL, Math.ceil(currentInterval * 2.0))
    } else if (rating === 'easy') {
      interval = Math.max(MIN_INTERVAL, Math.ceil(currentInterval * 2.5))
      ease = Math.min(2.6, ease + 0.15)
    }
  }

  interval = Math.min(Math.max(interval, MIN_INTERVAL), MAX_INTERVAL)
  card.intervalDays = interval
  card.lastInterval = interval
  card.easeFactor = ease
  card.due = new Date(now.getTime() + interval * DAY_IN_MS).toISOString()
  card.lastReviewed = now.toISOString()

  card.reviewCount += 1
  if (rating !== 'again') {
    card.successCount += 1
  }
  card.successRate = card.reviewCount ? card.successCount / card.reviewCount : 0
  card.mastery = Math.round(card.successRate * 100)
  card.history.unshift({
    grade: rating,
    value: gradeValue,
    timestamp: now.toISOString(),
    intervalDays: interval
  })
  if (card.history.length > 100) {
    card.history.length = 100
  }

  return {
    due: card.due,
    intervalDays: interval,
    easeFactor: ease,
    points: computePointsForRating(rating),
    requeue
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
    if (!card.due || card.status === 'new') {
      metrics.newCards += 1
    }
    if (card.due && new Date(card.due).getTime() <= now) {
      metrics.due += 1
    }
    if ((card.successRate || 0) >= 0.85 && (card.reviewCount || 0) >= 4) {
      metrics.mastered += 1
    }
    if (['learning', 'relearning'].includes(card.status)) {
      metrics.learning += 1
    }
  })
  if (!stage.metrics || typeof stage.metrics !== 'object') {
    stage.metrics = { ...metrics }
    return stage.metrics
  }
  const target = stage.metrics
  if (target.total !== metrics.total) {
    target.total = metrics.total
  }
  if (target.due !== metrics.due) {
    target.due = metrics.due
  }
  if (target.newCards !== metrics.newCards) {
    target.newCards = metrics.newCards
  }
  if (target.mastered !== metrics.mastered) {
    target.mastered = metrics.mastered
  }
  if (target.learning !== metrics.learning) {
    target.learning = metrics.learning
  }
  return target
}

export function buildSessionQueue(stage, { limitNew = DAILY_LIMITS.newCards, limitReview = DAILY_LIMITS.reviewCards } = {}) {
  if (!stage) {
    return []
  }
  const now = Date.now()
  const due = []
  const fresh = []
  stage.cards.forEach(card => {
    ensureCardShape(card)
    const dueDate = card.due ? new Date(card.due).getTime() : null
    if (!dueDate || card.status === 'new') {
      fresh.push(card)
    } else if (dueDate <= now) {
      due.push(card)
    }
  })
  due.sort((a, b) => {
    const aDue = a.due ? new Date(a.due).getTime() : 0
    const bDue = b.due ? new Date(b.due).getTime() : 0
    return aDue - bDue
  })
  fresh.sort((a, b) => {
    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return aCreated - bCreated
  })
  const dueSelection = due.slice(0, limitReview)
  const newSelection = fresh.slice(0, limitNew)
  const queue = []
  let dueIndex = 0
  let newIndex = 0
  while (dueIndex < dueSelection.length || newIndex < newSelection.length) {
    if (dueIndex < dueSelection.length) {
      queue.push(dueSelection[dueIndex])
      dueIndex += 1
    }
    if (newIndex < newSelection.length) {
      queue.push(newSelection[newIndex])
      newIndex += 1
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
        const dueDate = card.due ? new Date(card.due).getTime() : null
        if (!dueDate || card.status === 'new') {
          fresh += 1
        }
        if (dueDate && dueDate <= now) {
          due += 1
        }
      })
      const limitedDue = Math.min(due, DAILY_LIMITS.reviewCards)
      const limitedNew = Math.min(fresh, DAILY_LIMITS.newCards)
      if (limitedDue > 0 || limitedNew > 0) {
        summary.perStage.push({
          courseId: course.id,
          courseTitle: course.title,
          stageId: stage.id,
          stageTitle: stage.title,
          due: limitedDue,
          fresh: limitedNew
        })
      }
      summary.totalDue += limitedDue
      summary.totalNew += limitedNew
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

export function shouldShowCardNote(card) {
  if (!card || !card.note) {
    return false
  }
  ensureCardShape(card)
  if ((card.reviewCount || 0) === 0) {
    return true
  }
  if ((card.intervalDays || 0) < 3) {
    return true
  }
  if ((card.reviewCount || 0) <= 3) {
    return true
  }
  return (card.successRate || 0) < 0.8
}
