<template>
  <section v-if="stage && course" class="session-page">
    <header class="session-header">
      <div>
        <p class="session-header__breadcrumb">{{ course.title }} · {{ stage.title }}</p>
        <h1>Revision session</h1>
        <p>Keyboard shortcuts: ←/→ to navigate, space to flip, ↓ to reveal, numbers 1-4 to grade.</p>
        <p class="session-header__limits">
          Daily allowance remaining · {{ dailyAllowance.review }} review · {{ dailyAllowance.new }} new cards.
        </p>
      </div>
      <div class="session-header__stats">
        <div>
          <span class="meta-label">Progress</span>
          <span class="meta-value">{{ progressPercent }}%</span>
        </div>
        <div>
          <span class="meta-label">Points earned</span>
          <span class="meta-value">{{ sessionStats.points }}</span>
        </div>
        <div>
          <span class="meta-label">Queue</span>
          <span class="meta-value">{{ sessionStats.completed }}/{{ sessionStats.total }}</span>
        </div>
        <div class="session-header__control">
          <label class="toggle" for="session-audio-toggle">
            <input id="session-audio-toggle" type="checkbox" v-model="audioEnabled" />
            <span>{{ audioEnabled ? 'Audio on' : 'Audio muted' }}</span>
          </label>
        </div>
      </div>
    </header>
    <div class="progress-bar" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar__value" :style="{ width: progressPercent + '%' }"></div>
    </div>
    <p v-if="limitNotice" class="session-limit" role="status">{{ limitNotice }}</p>
    <section v-if="!sessionComplete" class="session-content">
      <article v-if="activeCard" class="session-card" :class="{ 'session-card--revealed': showAnswer }">
        <header class="session-card__header">
          <span>Card {{ sessionStats.completed + 1 }} of {{ sessionStats.total }}</span>
          <span v-if="shouldShowNote" class="session-card__note">{{ activeCard.note }}</span>
        </header>
        <div class="session-card__body">
          <div class="session-card__face session-card__face--front">
            <h2>Prompt</h2>
            <p>{{ activeCard.front }}</p>
          </div>
          <div class="session-card__face session-card__face--back" aria-live="polite">
            <h2>Answer</h2>
            <p v-if="showAnswer">{{ activeCard.back }}</p>
            <p v-else class="session-card__hidden">Press space or ↓ to reveal</p>
          </div>
          <div v-if="hasAudio" class="session-card__audio">
            <div class="session-card__audio-header">
              <h3>Audio support</h3>
              <label class="toggle" for="card-audio-toggle">
                <input id="card-audio-toggle" type="checkbox" v-model="audioEnabled" />
                <span>{{ audioEnabled ? 'Disable audio' : 'Enable audio' }}</span>
              </label>
            </div>
            <div v-if="activeCard.audio?.front" class="session-card__audio-track">
              <h4>Prompt</h4>
              <audio
                :key="`${activeCard.id}-front`"
                ref="frontAudioRef"
                :src="activeCard.audio.front.dataUrl || activeCard.audio.front.url"
                :type="activeCard.audio.front.mimeType"
                controls
                preload="auto"
              ></audio>
            </div>
            <div v-if="activeCard.audio?.back" class="session-card__audio-track">
              <h4>Answer</h4>
              <audio
                :key="`${activeCard.id}-back`"
                ref="backAudioRef"
                :src="activeCard.audio.back.dataUrl || activeCard.audio.back.url"
                :type="activeCard.audio.back.mimeType"
                controls
                preload="auto"
              ></audio>
            </div>
            <p v-if="audioEnabled && !hasPlayableAudio" class="session-card__audio-warning">Audio clip missing for this side.</p>
          </div>
        </div>
        <footer class="session-card__footer">
          <div class="session-navigation">
            <button class="button button--ghost" type="button" @click="goBack" :disabled="!canGoBack">← Previous</button>
            <button class="button button--ghost" type="button" @click="skipCard" :disabled="queueLength <= 1">Skip →</button>
          </div>
          <button class="button button--primary" type="button" @click="toggleAnswer">
            {{ showAnswer ? 'Hide answer' : 'Reveal answer' }}
          </button>
        </footer>
      </article>
      <aside class="session-actions" aria-label="Rating shortcuts">
        <h2>How well did you remember?</h2>
        <ul>
          <li v-for="option in reviewShortcuts" :key="option.key">
            <button class="button button--review" :style="{ '--accent': option.color }" type="button" @click="grade(option.value)" :disabled="!showAnswer">
              <span class="button__shortcut">{{ option.shortcut }}</span>
              <span class="button__label">{{ option.label }}</span>
            </button>
            <p class="session-actions__description">{{ option.description }}</p>
          </li>
        </ul>
      </aside>
    </section>
    <section v-else class="session-complete">
      <div class="session-complete__card">
        <h2>Session complete!</h2>
        <p v-if="sessionStats.total === 0">No cards were scheduled for review right now. Check back tomorrow or add new cards.</p>
        <p v-else>You reviewed {{ sessionStats.completed }} card{{ sessionStats.completed === 1 ? '' : 's' }} and earned {{ sessionStats.points }} points.</p>
        <p class="session-complete__note">Take a 5-minute break before starting another session to maximise spacing benefits.</p>
        <div class="session-complete__actions">
          <router-link class="button button--primary" :to="{ name: 'StageDetail', params: { courseId: course.id, stageId: stage.id } }">Review stage</router-link>
          <router-link class="button button--ghost" :to="{ name: 'Dashboard' }">Back to dashboard</router-link>
        </div>
      </div>
    </section>
  </section>
  <section v-else class="dashboard dashboard--empty">
    <div class="empty-card">
      <h1>Session unavailable</h1>
      <p>We couldn&apos;t find this stage. Return to the dashboard to pick another session.</p>
      <router-link class="button button--primary" :to="{ name: 'Dashboard' }">Back to dashboard</router-link>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { currentUser, useAuth } from '../composables/useAuth'
import {
  buildSessionQueue,
  computeStageMetrics,
  scheduleCard,
  REVIEW_SHORTCUTS,
  DAILY_LIMITS,
  getDailyAllowances,
  incrementDailyProgress
} from '../utils/srs'

const emit = defineEmits(['notify'])
const route = useRoute()
const { updateCurrentUser } = useAuth()

const queue = ref([])
const showAnswer = ref(false)
const sessionComplete = ref(false)
const sessionStats = reactive({
  reviewed: 0,
  completed: 0,
  points: 0,
  total: 0
})
const repeats = reactive({})
const previous = ref([])
const initialised = ref(false)
const frontAudioRef = ref(null)
const backAudioRef = ref(null)
const AUDIO_PREF_KEY = 'digiflashcards.audioEnabled'
const hasWindow = typeof window !== 'undefined'
const storedPreference = hasWindow ? window.localStorage.getItem(AUDIO_PREF_KEY) : null
const audioEnabled = ref(storedPreference ? storedPreference !== 'false' : true)

let sessionDailyRecord = { new: new Set(), review: new Set() }

const course = computed(() => {
  const courseId = route.params.courseId
  return currentUser.value?.courses.find(item => item.id === courseId) ?? null
})

const stage = computed(() => {
  const stageId = route.params.stageId
  return course.value?.stages.find(item => item.id === stageId) ?? null
})

const activeCard = computed(() => queue.value[0] ?? null)
const queueLength = computed(() => queue.value.length)
const canGoBack = computed(() => previous.value.length > 0)
const progressPercent = computed(() => {
  if (!sessionStats.total) {
    return 0
  }
  return Math.round((sessionStats.completed / sessionStats.total) * 100)
})

const reviewShortcuts = REVIEW_SHORTCUTS
const dailyAllowance = computed(() => {
  if (!stage.value) {
    return { new: DAILY_LIMITS.newCards, review: DAILY_LIMITS.reviewCards }
  }
  return getDailyAllowances(stage.value, DAILY_LIMITS)
})
const shouldShowNote = computed(() => {
  const card = activeCard.value
  if (!card || !card.note) {
    return false
  }
  const mastery = typeof card.mastery === 'number' ? card.mastery : 0
  return card.status !== 'review' || mastery < 60
})
const hasAudio = computed(() => {
  const card = activeCard.value
  return Boolean(card?.audio?.front || card?.audio?.back)
})
const hasPlayableAudio = computed(() => {
  const card = activeCard.value
  if (!card) {
    return false
  }
  if (showAnswer.value) {
    return Boolean(card.audio?.back)
  }
  return Boolean(card.audio?.front)
})
const limitNotice = computed(() => {
  if (!stage.value) {
    return ''
  }
  const allowance = dailyAllowance.value
  const parts = []
  if (allowance.review === 0 && (stage.value.metrics?.due || 0) > 0) {
    parts.push('Daily review limit reached. Remaining cards will return tomorrow.')
  }
  if (allowance.new === 0 && (stage.value.metrics?.newCards || 0) > 0) {
    parts.push('Daily new card limit reached. New cards unlock on the next study day.')
  }
  return parts.join(' ')
})

function resetSessionState() {
  queue.value = buildSessionQueue(stage.value, {
    limitNew: DAILY_LIMITS.newCards,
    limitReview: DAILY_LIMITS.reviewCards
  })
  sessionStats.reviewed = 0
  sessionStats.completed = 0
  sessionStats.points = 0
  sessionStats.total = queue.value.length
  sessionComplete.value = sessionStats.total === 0
  showAnswer.value = false
  previous.value = []
  sessionDailyRecord = { new: new Set(), review: new Set() }
  Object.keys(repeats).forEach(key => { delete repeats[key] })
  resetAudioPlayback()
}

function toggleAnswer() {
  showAnswer.value = !showAnswer.value
}

function skipCard() {
  if (queue.value.length <= 1) {
    return
  }
  resetAudioPlayback()
  const [card] = queue.value.splice(0, 1)
  queue.value.push(card)
  showAnswer.value = false
}

function goBack() {
  if (!previous.value.length) {
    return
  }
  resetAudioPlayback()
  const previousId = previous.value.pop()
  const card = stage.value?.cards.find(item => item.id === previousId)
  if (!card) {
    return
  }
  queue.value.unshift(card)
  if (sessionStats.completed > 0) {
    sessionStats.completed -= 1
  }
  sessionComplete.value = false
  showAnswer.value = false
}

function grade(value) {
  if (!activeCard.value || !stage.value || !course.value || !showAnswer.value) {
    return
  }
  const cardRef = activeCard.value
  const studyType = cardRef.status === 'new' ? 'new' : 'review'
  let result = null
  updateCurrentUser(user => {
    const targetCourse = user.courses.find(item => item.id === course.value.id)
    if (!targetCourse) {
      return
    }
    const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
    if (!targetStage) {
      return
    }
    const targetCard = targetStage.cards.find(item => item.id === cardRef.id)
    if (!targetCard) {
      return
    }
    result = scheduleCard(targetCard, value)
    targetStage.points = (targetStage.points || 0) + result.points
    if (studyType && !sessionDailyRecord[studyType].has(cardRef.id)) {
      incrementDailyProgress(targetStage, studyType)
      sessionDailyRecord[studyType].add(cardRef.id)
    }
    computeStageMetrics(targetStage)
  })
  if (!result) {
    return
  }
  resetAudioPlayback()
  sessionStats.reviewed += 1
  sessionStats.points += result.points
  previous.value.push(cardRef.id)
  queue.value.shift()
  if (result.requeue) {
    const count = repeats[cardRef.id] ?? 0
    if (count < 2) {
      repeats[cardRef.id] = count + 1
      queue.value.splice(Math.min(3, queue.value.length), 0, cardRef)
    } else {
      repeats[cardRef.id] = 0
      sessionStats.completed += 1
    }
  } else {
    repeats[cardRef.id] = 0
    sessionStats.completed += 1
  }
  if (!queue.value.length) {
    sessionComplete.value = true
    emit('notify', 'Session complete! Great work.')
  }
  showAnswer.value = false
}

function handleKey(event) {
  const tagName = event.target?.tagName
  if (tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
    return
  }
  if (['1', '2', '3', '4'].includes(event.key)) {
    event.preventDefault()
    grade(Number(event.key))
  } else if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault()
    toggleAnswer()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    skipCard()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goBack()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    showAnswer.value = true
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    showAnswer.value = false
  }
}

watch(stage, (value) => {
  if (value && !initialised.value) {
    resetSessionState()
    initialised.value = true
  }
}, { immediate: true })

watch(() => route.params.stageId, () => {
  initialised.value = false
})

onMounted(() => {
  window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})

function stopAudio(side) {
  const element = side === 'back' ? backAudioRef.value : frontAudioRef.value
  if (element) {
    try {
      element.pause()
    } catch (error) {
      // Ignore pause errors (e.g. element already stopped)
    }
    element.currentTime = 0
  }
}

function resetAudioPlayback() {
  stopAudio('front')
  stopAudio('back')
}

async function playAudio(side) {
  if (!audioEnabled.value) {
    return
  }
  const element = side === 'back' ? backAudioRef.value : frontAudioRef.value
  if (!element) {
    return
  }
  try {
    element.currentTime = 0
    await element.play()
  } catch (error) {
    // Playback can be blocked by browser policies; ignore silently
  }
}

watch(activeCard, async card => {
  resetAudioPlayback()
  if (!card) {
    return
  }
  await nextTick()
  if (audioEnabled.value && card.audio?.front) {
    await playAudio('front')
  }
})

watch(showAnswer, async value => {
  if (!value) {
    stopAudio('back')
    if (audioEnabled.value && activeCard.value?.audio?.front) {
      await nextTick()
      await playAudio('front')
    }
    return
  }
  await nextTick()
  if (audioEnabled.value && activeCard.value?.audio?.back) {
    await playAudio('back')
  }
})

watch(audioEnabled, value => {
  if (hasWindow) {
    window.localStorage.setItem(AUDIO_PREF_KEY, value ? 'true' : 'false')
  }
  if (!value) {
    resetAudioPlayback()
    return
  }
  nextTick(async () => {
    if (showAnswer.value && activeCard.value?.audio?.back) {
      await playAudio('back')
    } else if (activeCard.value?.audio?.front) {
      await playAudio('front')
    }
  })
})
</script>
