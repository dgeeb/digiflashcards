<template>
  <section class="dashboard" v-if="courseCards.length">
    <header class="dashboard__intro">
      <div>
        <h1>Today&apos;s session</h1>
        <p>Keep your momentum! Your personalised spaced repetition plan is ready.</p>
      </div>
      <div class="dashboard__summary">
        <div class="summary-chip">
          <span class="summary-chip__label">Due reviews</span>
          <span class="summary-chip__value">{{ dailySummary.totalDue }}</span>
        </div>
        <div class="summary-chip">
          <span class="summary-chip__label">New cards</span>
          <span class="summary-chip__value">{{ dailySummary.totalNew }}</span>
        </div>
      </div>
    </header>
    <section class="dashboard__today">
      <h2>Focus for the day</h2>
      <p v-if="!dailySummary.perStage.length" class="empty-state">Everything is up to date. Why not add more cards?</p>
      <ul v-else class="daily-list">
        <li v-for="item in dailySummary.perStage" :key="item.stageId" class="daily-item">
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
    <section class="dashboard__courses">
      <header class="dashboard__courses-header">
        <div>
          <h2>Your courses</h2>
          <p>Create stages and cards to shape your learning journey.</p>
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
      <div class="course-grid">
        <article v-for="course in courseCards" :key="course.id" class="course-card">
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
          <footer class="course-card__footer">
            <button class="button button--ghost" type="button" @click="viewCourse(course.id)">Open course</button>
          </footer>
        </article>
      </div>
    </section>
  </section>
  <section v-else class="dashboard dashboard--empty">
    <div class="empty-card">
      <h1>Let&apos;s build your first course</h1>
      <p>Create stages to organise your content and add cards to feed the spaced repetition engine.</p>
      <button class="button button--primary" type="button" @click="toggleForm">Create a course</button>
      <form v-if="showForm" class="inline-form inline-form--center" @submit.prevent="createCourse">
        <div class="form-field">
          <label for="course-title-empty">Title</label>
          <input id="course-title-empty" v-model="courseForm.title" type="text" required />
        </div>
        <div class="form-field">
          <label for="course-description-empty">Description</label>
          <input id="course-description-empty" v-model="courseForm.description" type="text" />
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <button class="button button--success" type="submit">Create course</button>
      </form>
    </div>
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
const { updateCurrentUser } = useAuth()

const showForm = ref(false)
const formError = ref('')
const courseForm = reactive({
  title: '',
  description: ''
})

const courses = computed(() => currentUser.value?.courses ?? [])
const dailySummary = computed(() => summariseDailyAssignments(courses.value))
const courseCards = computed(() => courses.value.map(course => {
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

function openStage(item) {
  router.push({ name: 'StageSession', params: { courseId: item.courseId, stageId: item.stageId } })
}

function viewCourse(courseId) {
  router.push({ name: 'CourseDetail', params: { courseId } })
}
</script>
