<template>
  <section class="dashboard">
    <header class="dashboard__intro">
      <div>
        <h1>{{ isCreatorMode ? 'Creator workspace' : 'Student workspace' }}</h1>
        <p>
          {{
            isCreatorMode
              ? 'Design impactful courses, organise stages, and prepare cards for your learners.'
              : 'Join shared courses, keep up with your training plan, and focus on today’s reviews.'
          }}
        </p>
      </div>
      <div class="dashboard__intro-actions">
        <div class="dashboard__summary" v-if="activeSummary.totalDue || activeSummary.totalNew">
          <div class="summary-chip">
            <span class="summary-chip__label">Due reviews</span>
            <span class="summary-chip__value">{{ activeSummary.totalDue }}</span>
          </div>
          <div class="summary-chip">
            <span class="summary-chip__label">New cards</span>
            <span class="summary-chip__value">{{ activeSummary.totalNew }}</span>
          </div>
        </div>
        <div class="dashboard__mode-toggle" role="group" aria-label="Switch workspace">
          <button
            type="button"
            class="mode-toggle__button"
            :class="{ 'mode-toggle__button--active': isCreatorMode }"
            @click="switchMode('creator')"
          >
            Creator
          </button>
          <button
            type="button"
            class="mode-toggle__button"
            :class="{ 'mode-toggle__button--active': !isCreatorMode }"
            @click="switchMode('student')"
          >
            Student
          </button>
        </div>
      </div>
    </header>

    <section class="dashboard__today">
      <h2>Focus for the day</h2>
      <p v-if="!activeSummary.perStage.length" class="empty-state">
        {{
          isCreatorMode
            ? 'Everything is up to date. Add new cards or create a stage to keep building your course.'
            : 'No reviews scheduled yet. Join a shared course or revisit one of your sessions.'
        }}
      </p>
      <ul v-else class="daily-list">
        <li v-for="item in activeSummary.perStage" :key="item.stageId" class="daily-item">
          <div>
            <h3>{{ item.courseTitle }} — {{ item.stageTitle }}</h3>
            <p>{{ item.due }} review{{ item.due === 1 ? '' : 's' }} · {{ item.fresh }} new card{{ item.fresh === 1 ? '' : 's' }}</p>
          </div>
          <div class="daily-item__actions">
            <button class="button button--ghost" type="button" @click="openStage(item)">Start session</button>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="isCreatorMode" class="dashboard__courses">
      <header class="dashboard__courses-header">
        <div>
          <h2>Your courses</h2>
          <p>Create stages and cards to shape your learning journey. Share the link to invite learners.</p>
        </div>
        <button class="button button--primary" type="button" @click="toggleForm">
          {{ showForm ? 'Close' : 'New course' }}
        </button>
      </header>
      <form v-if="showForm" class="inline-form" @submit.prevent="createCourse">
        <div class="form-grid">
          <div class="form-field">
            <label for="course-title">Title</label>
            <input id="course-title" v-model="courseForm.title" type="text" required />
          </div>
          <div class="form-field">
            <label for="course-description">Description</label>
            <input id="course-description" v-model="courseForm.description" type="text" placeholder="What will you master?" />
          </div>
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <button class="button button--success" type="submit">Create course</button>
      </form>
      <div v-if="!creatorCourseCards.length" class="empty-card empty-card--inline">
        <h3>Let’s build your first course</h3>
        <p>Create stages to organise your content and add cards to feed the spaced repetition engine.</p>
      </div>
      <div v-else class="course-grid">
        <article v-for="course in creatorCourseCards" :key="course.id" class="course-card">
          <header class="course-card__header">
            <h3>{{ course.title }}</h3>
            <span class="course-card__points">{{ course.points }} pts</span>
          </header>
          <p class="course-card__description">{{ course.description || 'No description yet.' }}</p>
          <dl class="course-card__stats">
            <div>
              <dt>Stages</dt>
              <dd>{{ course.stageCount }}</dd>
            </div>
            <div>
              <dt>Cards</dt>
              <dd>{{ course.totalCards }}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>{{ course.due }}</dd>
            </div>
            <div>
              <dt>New</dt>
              <dd>{{ course.newCards }}</dd>
            </div>
            <div>
              <dt>Mastered</dt>
              <dd>{{ course.mastered }}</dd>
            </div>
          </dl>
          <div class="course-card__share" v-if="course.shareUrl">
            <label :for="`share-${course.id}`">Share link</label>
            <div class="course-card__share-actions">
              <input :id="`share-${course.id}`" :value="course.shareUrl" readonly />
              <button type="button" class="button button--ghost" @click="copyShareLink(course.shareUrl)">Copy</button>
            </div>
          </div>
          <footer class="course-card__footer">
            <button class="button button--ghost" type="button" @click="viewCourse(course.id)">Manage course</button>
            <button class="link-button link-button--danger" type="button" @click="deleteCourse(course.id)">Delete course</button>
          </footer>
        </article>
      </div>
    </section>

    <section v-else class="dashboard__courses">
      <header class="dashboard__courses-header">
        <div>
          <h2>Joined courses</h2>
          <p>Paste a shared link or code from a course creator to start training.</p>
        </div>
      </header>
      <form class="inline-form" @submit.prevent="handleJoinCourse">
        <div class="form-grid">
          <div class="form-field">
            <label for="join-code">Share link or code</label>
            <input
              id="join-code"
              v-model="joinInput"
              type="text"
              placeholder="https://… or course code"
              required
            />
          </div>
        </div>
        <p v-if="joinError" class="form-error" role="alert">{{ joinError }}</p>
        <button class="button button--success" type="submit" :disabled="joining">
          {{ joining ? 'Joining…' : 'Join course' }}
        </button>
      </form>
      <div v-if="!studentCourseCards.length" class="empty-card empty-card--inline">
        <h3>No joined courses yet</h3>
        <p>Ask a course creator for their share link to add it to your learning dashboard.</p>
      </div>
      <div v-else class="course-grid">
        <article v-for="course in studentCourseCards" :key="course.id" class="course-card">
          <header class="course-card__header">
            <h3>{{ course.title }}</h3>
            <span class="course-card__points">{{ course.points }} pts</span>
          </header>
          <p class="course-card__description">
            {{ course.description || 'No description yet.' }}
            <br />
            <small>Shared by {{ course.ownerName || 'the course author' }}</small>
          </p>
          <dl class="course-card__stats">
            <div>
              <dt>Stages</dt>
              <dd>{{ course.stageCount }}</dd>
            </div>
            <div>
              <dt>Cards</dt>
              <dd>{{ course.totalCards }}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>{{ course.due }}</dd>
            </div>
            <div>
              <dt>New</dt>
              <dd>{{ course.newCards }}</dd>
            </div>
            <div>
              <dt>Mastered</dt>
              <dd>{{ course.mastered }}</dd>
            </div>
          </dl>
          <footer class="course-card__footer">
            <button class="button button--ghost" type="button" @click="viewCourse(course.id)">Open course</button>
            <button class="link-button link-button--danger" type="button" @click="leaveCourse(course.id)">Leave course</button>
          </footer>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, useAuth } from '../composables/useAuth'
import { createId } from '../utils/id'
import { computeStageMetrics, summariseDailyAssignments } from '../utils/srs'

const emit = defineEmits(['notify'])
const router = useRouter()
const { updateCurrentUser, setWorkspaceMode, joinSharedCourse } = useAuth()

const showForm = ref(false)
const formError = ref('')
const courseForm = reactive({
  title: '',
  description: ''
})
const joinInput = ref('')
const joinError = ref('')
const joining = ref(false)

const courses = computed(() => currentUser.value?.courses ?? [])
const workspaceMode = computed(() => currentUser.value?.preferences?.workspaceMode ?? 'creator')
const isCreatorMode = computed(() => workspaceMode.value === 'creator')
const creatorCourses = computed(() => courses.value.filter(course => course.role !== 'student'))
const studentCourses = computed(() => courses.value.filter(course => course.role === 'student'))
const creatorSummary = computed(() => summariseDailyAssignments(creatorCourses.value))
const studentSummary = computed(() => summariseDailyAssignments(studentCourses.value))
const activeSummary = computed(() => (isCreatorMode.value ? creatorSummary.value : studentSummary.value))

const shareBase = computed(() => {
  if (typeof window === 'undefined') {
    return ''
  }
  const { origin, pathname } = window.location
  return `${origin}${pathname}`.replace(/index\.html$/, '').replace(/\/$/, '')
})

const creatorCourseCards = computed(() => creatorCourses.value.map(course => {
  let due = 0
  let fresh = 0
  let mastered = 0
  let totalCards = 0
  course.stages.forEach(stage => {
    const metrics = computeStageMetrics(stage)
    due += metrics.due
    fresh += metrics.newCards
    mastered += metrics.mastered
    totalCards += metrics.total
  })
  const shareUrl = course.shareCode ? `${shareBase.value}/#/join/${course.shareCode}` : ''
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    points: course.points ?? 0,
    stageCount: course.stages.length,
    due,
    newCards: fresh,
    mastered,
    totalCards,
    shareUrl
  }
}))

const studentCourseCards = computed(() => studentCourses.value.map(course => {
  let due = 0
  let fresh = 0
  let mastered = 0
  let totalCards = 0
  course.stages.forEach(stage => {
    const metrics = computeStageMetrics(stage)
    due += metrics.due
    fresh += metrics.newCards
    mastered += metrics.mastered
    totalCards += metrics.total
  })
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    ownerName: course.ownerName,
    points: course.points ?? 0,
    stageCount: course.stages.length,
    due,
    newCards: fresh,
    mastered,
    totalCards
  }
}))

watchEffect(() => {
  courses.value.forEach(course => {
    course.stages.forEach(stage => computeStageMetrics(stage))
  })
})

function toggleForm() {
  showForm.value = !showForm.value
}

function resetForm() {
  courseForm.title = ''
  courseForm.description = ''
  formError.value = ''
}

function createCourse() {
  if (!courseForm.title.trim()) {
    formError.value = 'A course title is required.'
    return
  }
  updateCurrentUser(user => {
    user.courses.push({
      id: createId(),
      role: 'creator',
      title: courseForm.title.trim(),
      description: courseForm.description.trim(),
      createdAt: new Date().toISOString(),
      points: 0,
      stages: []
    })
  })
  emit('notify', 'New course created! Add a stage to begin.')
  resetForm()
  showForm.value = false
}

function switchMode(mode) {
  if (mode === workspaceMode.value) {
    return
  }
  setWorkspaceMode(mode)
  showForm.value = false
}

function openStage(item) {
  router.push({ name: 'StageSession', params: { courseId: item.courseId, stageId: item.stageId } })
}

function viewCourse(courseId) {
  router.push({ name: 'CourseDetail', params: { courseId } })
}

function deleteCourse(courseId) {
  updateCurrentUser(user => {
    user.courses = user.courses.filter(course => !(course.id === courseId && course.role !== 'student'))
  })
  emit('notify', 'Course deleted from your creator workspace.')
}

function leaveCourse(courseId) {
  updateCurrentUser(user => {
    user.courses = user.courses.filter(course => !(course.id === courseId && course.role === 'student'))
  })
  emit('notify', 'Course removed from your student workspace.')
}

async function copyShareLink(link) {
  if (!link) {
    return
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link)
    } else {
      const helper = document.createElement('textarea')
      helper.value = link
      helper.setAttribute('readonly', '')
      helper.style.position = 'absolute'
      helper.style.opacity = '0'
      document.body.appendChild(helper)
      helper.select()
      document.execCommand('copy')
      document.body.removeChild(helper)
    }
    emit('notify', 'Share link copied to clipboard.')
  } catch (error) {
    console.warn('Copy failed', error)
    emit('notify', 'Unable to copy automatically. Select the link and copy it manually.')
  }
}

async function handleJoinCourse() {
  if (joining.value) {
    return
  }
  joinError.value = ''
  joining.value = true
  try {
    const course = await joinSharedCourse(joinInput.value)
    if (course) {
      emit('notify', 'Course added to your student dashboard!')
      joinInput.value = ''
    }
  } catch (error) {
    joinError.value = error?.message || 'Unable to join the course. Please try again.'
  } finally {
    joining.value = false
  }
}
</script>
