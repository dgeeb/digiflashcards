<template>
  <section v-if="stage && course" class="session-page">
    <header class="session-header">
      <div>
        <p class="session-header__breadcrumb">{{ course.title }} · {{ stage.title }}</p>
        <h1>Revision session</h1>
        <p>Keyboard shortcuts: ↓ reveal, space toggle, ←/→ navigate, 1–4 grade.</p>
      </div>
      <div class="session-header__controls">
        <label class="audio-toggle" for="session-audio-toggle">
          <input id="session-audio-toggle" type="checkbox" v-model="audioEnabled" />
          <span>{{ audioEnabled ? 'Audio enabled' : 'Audio disabled' }}</span>
        </label>
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
      </div>
    </header>
    <div class="progress-bar" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar__value" :style="{ width: progressPercent + '%' }"></div>
    </div>
    <section v-if="!sessionComplete" class="session-content">
      <article v-if="activeCard" class="session-card" :class="{ 'session-card--revealed': showAnswer }">
        <header class="session-card__header">
          <span>Card {{ sessionStats.completed + 1 }} of {{ sessionStats.total }}</span>
          <span v-if="shouldShowNote" class="session-card__note">{{ activeCard.note }}</span>
        </header>
        <div class="session-card__body">
          <div class="session-card__face session-card__face--front">
            <div class="session-card__face-header">
              <h2>Prompt</h2>
              <button
                v-if="hasFrontAudio"
                class="audio-button"
                type="button"
                :disabled="!audioEnabled"
                @click="playAudioClip('front')"
              >
                🔊<span class="sr-only">Play prompt audio</span>
              </button>
            </div>
            <p>{{ activeCard.front }}</p>
          </div>
          <div class="session-card__face session-card__face--back" aria-live="polite">
            <div class="session-card__face-header">
              <h2>Answer</h2>
              <button
                v-if="hasBackAudio"
                class="audio-button"
                type="button"
                :disabled="!audioEnabled"
                @click="playAudioClip('back')"
              >
                🔊<span class="sr-only">Play answer audio</span>
              </button>
            </div>
            <p v-if="showAnswer">{{ activeCard.back }}</p>
            <p v-else class="session-card__hidden">Press space or ↓ to reveal</p>
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
import { buildSessionQueue, computeStageMetrics, scheduleCard, REVIEW_SHORTCUTS, DAILY_LIMITS, shouldShowCardNote } from '../utils/srs'

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

const audioEnabled = computed({
  get: () => currentUser.value?.preferences?.audioEnabled !== false,
  set: value => {
    updateCurrentUser(user => {
      user.preferences.audioEnabled = Boolean(value)
    })
    if (!value) {
      stopAudio()
    }
  }
})

const shouldShowNote = computed(() => shouldShowCardNote(activeCard.value))
const hasFrontAudio = computed(() => Boolean(activeCard.value?.audio?.front?.dataUrl))
const hasBackAudio = computed(() => Boolean(activeCard.value?.audio?.back?.dataUrl))
const currentAudio = ref(null)

function stopAudio() {
  if (!currentAudio.value) {
    return
  }
  try {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
  } catch (error) {
    // noop
  }
  currentAudio.value = null
}

function playAudioClip(side, { auto = false } = {}) {
  const card = activeCard.value
  if (!card || !card.audio) {
    return
  }
  if (!audioEnabled.value) {
    if (!auto) {
      emit('notify', 'Audio is disabled for this session. Enable it to listen to pronunciations.')
    }
    return
  }
  if (auto) {
    if (side === 'front' && !['front', 'both'].includes(card.audioSide)) {
      return
    }
    if (side === 'back' && !['back', 'both'].includes(card.audioSide)) {
      return
    }
  }
  const clip = card.audio?.[side]
  if (!clip?.dataUrl || typeof Audio === 'undefined') {
    return
  }
  stopAudio()
  try {
    const element = new Audio(clip.dataUrl)
    element.play().catch(error => {
      console.warn('Audio playback failed', error)
    })
    currentAudio.value = element
  } catch (error) {
    console.warn('Unable to play audio clip', error)
  }
}

function resetSessionState() {
  stopAudio()
  queue.value = buildSessionQueue(stage.value, { limitNew: DAILY_LIMITS.newCards, limitReview: DAILY_LIMITS.reviewCards })
  sessionStats.reviewed = 0
  sessionStats.completed = 0
  sessionStats.points = 0
  sessionStats.total = queue.value.length
  sessionComplete.value = sessionStats.total === 0
  showAnswer.value = false
  previous.value = []
  Object.keys(repeats).forEach(key => { delete repeats[key] })
}

function toggleAnswer() {
  showAnswer.value = !showAnswer.value
}

function skipCard() {
  if (queue.value.length <= 1) {
    return
  }
  stopAudio()
  const [card] = queue.value.splice(0, 1)
  queue.value.push(card)
  showAnswer.value = false
}

function goBack() {
  if (!previous.value.length) {
    return
  }
  stopAudio()
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
  stopAudio()
  const cardRef = activeCard.value
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
    computeStageMetrics(targetStage)
  })
  if (!result) {
    return
  }
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

watch(activeCard, async card => {
  stopAudio()
  if (!card) {
    return
  }
  showAnswer.value = false
  await nextTick()
  playAudioClip('front', { auto: true })
})

watch(showAnswer, value => {
  if (value) {
    nextTick(() => playAudioClip('back', { auto: true }))
  } else {
    stopAudio()
  }
})

watch(() => route.params.stageId, () => {
  initialised.value = false
})

onMounted(() => {
  window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
  stopAudio()
})
</script>
