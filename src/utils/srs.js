import { createId } from './id'

const DAY_IN_MS = 86400000

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

const gradeConfiguration = {
  1: { easeDelta: 0.15, intervalMultiplier: 3, baseInterval: 2, requeue: false, points: 15 },
  2: { easeDelta: 0.05, intervalMultiplier: 2, baseInterval: 1, requeue: false, points: 10 },
  3: { easeDelta: -0.05, intervalMultiplier: 1, baseInterval: 0.5, requeue: true, points: 4 },
  4: { easeDelta: -0.2, intervalMultiplier: 0, baseInterval: 0.17, requeue: true, points: 1 }
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
  if (card.audio && typeof card.audio === 'object') {
    card.audio.id = card.audio.id || createId()
    card.audio.source = card.audio.source || 'upload'
    card.audio.mimeType = card.audio.mimeType || 'audio/mpeg'
    card.audio.textSource = card.audio.textSource || 'front'
    if (card.audio.dataUrl || card.audio.url) {
      card.audio.dataUrl = card.audio.dataUrl || card.audio.url
    } else {
      card.audio = null
    }
  } else {
    card.audio = null
  }
}

export function ensureStageStructure(stage) {
  if (!stage) {
    return stage
  }
  stage.cards = Array.isArray(stage.cards) ? stage.cards : []
  stage.points = typeof stage.points === 'number' ? stage.points : 0
  stage.metrics = computeStageMetrics(stage)
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
  const now = new Date()
  const config = gradeConfiguration[gradeValue] || gradeConfiguration[4]
  const ease = Math.max(1.3, (card.easeFactor || 2.5) + config.easeDelta)
  let interval = card.intervalDays || config.baseInterval
  if (card.status === 'new') {
    interval = config.baseInterval
  } else if (config.intervalMultiplier === 0) {
    interval = Math.max(config.baseInterval, 0.15)
  } else {
    interval = Math.max(config.baseInterval, interval * ease * config.intervalMultiplier)
  }
  const dueTimestamp = now.getTime() + interval * DAY_IN_MS
  card.easeFactor = ease
  card.intervalDays = interval
  card.due = new Date(dueTimestamp).toISOString()
  card.lastReviewed = now.toISOString()
  card.status = 'review'
  const masteryDelta = gradeValue === 1 ? 4 : gradeValue === 2 ? 2 : gradeValue === 3 ? -1 : -3
  card.mastery = Math.max(0, Math.min(100, (card.mastery || 0) + masteryDelta))
  card.history.unshift({
    grade: gradeValue,
    timestamp: now.toISOString(),
    intervalDays: interval
  })
  return {
    due: card.due,
    intervalDays: interval,
    easeFactor: ease,
    points: config.points,
    requeue: config.requeue
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
    if (card.status === 'review' && card.mastery < 60) {
      metrics.learning += 1
    }
  })
  stage.metrics = metrics
  return metrics
}

export function buildSessionQueue(stage, { limitNew = 10 } = {}) {
  if (!stage) {
    return []
  }
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
  const newSelection = fresh.slice(0, limitNew)
  return [...due, ...newSelection]
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
