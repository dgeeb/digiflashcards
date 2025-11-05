<template>
  <section v-if="course" class="course-detail">
    <header class="course-detail__header">
      <div>
        <h1>{{ course.title }}</h1>
        <p>{{ course.description || 'Add a description to tell learners what this course is about.' }}</p>
      </div>
      <div class="course-detail__meta">
        <div>
          <span class="meta-label">Total points</span>
          <span class="meta-value">{{ course.points ?? 0 }}</span>
        </div>
        <div>
          <span class="meta-label">Stages</span>
          <span class="meta-value">{{ course.stages.length }}</span>
        </div>
        <div>
          <span class="meta-label">Workspace</span>
          <span class="meta-value">{{ isStudentCourse ? 'Student' : 'Creator' }}</span>
        </div>
      </div>
      <div v-if="shareLink" class="course-detail__share">
        <label :for="`share-${course.id}`">Share this course</label>
        <div class="course-detail__share-actions">
          <input :id="`share-${course.id}`" :value="shareLink" readonly />
          <button class="button button--ghost" type="button" @click="copyShareLink">Copy</button>
        </div>
      </div>
    </header>
    <section class="course-detail__actions" v-if="!isStudentCourse">
      <h2>Create a stage</h2>
      <form class="inline-form" @submit.prevent="createStage">
        <div class="form-grid">
          <div class="form-field">
            <label for="stage-title">Stage name</label>
            <input id="stage-title" v-model="stageForm.title" type="text" required placeholder="e.g. Stage 1 — Basics" />
          </div>
          <div class="form-field">
            <label for="stage-description">Description</label>
            <input id="stage-description" v-model="stageForm.description" type="text" placeholder="What will this stage cover?" />
          </div>
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <button class="button button--success" type="submit">Add stage</button>
      </form>
    </section>
    <section v-else class="course-detail__actions course-detail__actions--student">
      <h2>Training workspace</h2>
      <p>You can review any stage below. Content updates from the course creator appear automatically.</p>
    </section>
    <section class="course-detail__stages">
      <h2>Stages</h2>
      <p v-if="!course.stages.length" class="empty-state">No stages yet. Create one above to get started.</p>
      <div class="stage-grid">
        <article v-for="stage in course.stages" :key="stage.id" class="stage-card">
          <header class="stage-card__header">
            <h3>{{ stage.title }}</h3>
            <span class="stage-card__points">{{ stage.points ?? 0 }} pts</span>
          </header>
          <p class="stage-card__description">{{ stage.description || 'No description yet.' }}</p>
          <dl class="stage-card__stats">
            <div>
              <dt>Cards</dt>
              <dd>{{ stage.metrics.total }}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>{{ stage.metrics.due }}</dd>
            </div>
            <div>
              <dt>New</dt>
              <dd>{{ stage.metrics.newCards }}</dd>
            </div>
            <div>
              <dt>Mastered</dt>
              <dd>{{ stage.metrics.mastered }}</dd>
            </div>
          </dl>
          <footer class="stage-card__footer">
            <button class="button button--ghost" type="button" @click="openStage(stage)">
              {{ isStudentCourse ? 'Train now' : 'Start session' }}
            </button>
            <button
              class="button button--primary"
              type="button"
              @click="manageStage(stage)"
            >
              {{ isStudentCourse ? 'View cards' : 'Manage cards' }}
            </button>
          </footer>
        </article>
      </div>
    </section>
  </section>
  <section v-else class="dashboard dashboard--empty">
    <div class="empty-card">
      <h1>Course not found</h1>
      <p>The course you are looking for does not exist anymore.</p>
      <router-link class="button button--primary" :to="{ name: 'Dashboard' }">Back to dashboard</router-link>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser, useAuth } from '../composables/useAuth'
import { createId } from '../utils/id'
import { computeStageMetrics } from '../utils/srs'

const emit = defineEmits(['notify'])
const route = useRoute()
const router = useRouter()
const { updateCurrentUser } = useAuth()

const stageForm = reactive({
  title: '',
  description: ''
})
const formError = ref('')

const course = computed(() => {
  const id = route.params.courseId
  return currentUser.value?.courses.find(item => item.id === id) ?? null
})

const isStudentCourse = computed(() => course.value?.role === 'student')

const shareLink = computed(() => {
  if (!course.value?.shareCode || isStudentCourse.value) {
    return ''
  }
  if (typeof window === 'undefined') {
    return ''
  }
  const { origin, pathname } = window.location
  const base = `${origin}${pathname}`.replace(/index\.html$/, '').replace(/\/$/, '')
  return `${base}/#/join/${course.value.shareCode}`
})

function resetForm() {
  stageForm.title = ''
  stageForm.description = ''
  formError.value = ''
}

function createStage() {
  if (!course.value || isStudentCourse.value) {
    return
  }
  if (!stageForm.title.trim()) {
    formError.value = 'Stage name is required.'
    return
  }
  updateCurrentUser(user => {
    const targetCourse = user.courses.find(item => item.id === course.value.id)
    if (!targetCourse) {
      return
    }
    targetCourse.stages.push({
      id: createId(),
      title: stageForm.title.trim(),
      description: stageForm.description.trim(),
      createdAt: new Date().toISOString(),
      points: 0,
      cards: [],
      metrics: {
        total: 0,
        due: 0,
        newCards: 0,
        mastered: 0,
        learning: 0
      }
    })
  })
  emit('notify', 'Stage created! Add cards to prepare your review session.')
  resetForm()
}

function openStage(stage) {
  if (!course.value) {
    return
  }
  router.push({ name: 'StageSession', params: { courseId: course.value.id, stageId: stage.id } })
}

function manageStage(stage) {
  if (!course.value) {
    return
  }
  router.push({ name: 'StageDetail', params: { courseId: course.value.id, stageId: stage.id } })
}

async function copyShareLink() {
  if (!shareLink.value) {
    return
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareLink.value)
    } else {
      const helper = document.createElement('textarea')
      helper.value = shareLink.value
      helper.setAttribute('readonly', '')
      helper.style.position = 'absolute'
      helper.style.opacity = '0'
      document.body.appendChild(helper)
      helper.select()
      document.execCommand('copy')
      document.body.removeChild(helper)
    }
    emit('notify', 'Share link copied!')
  } catch (error) {
    console.warn('Copy failed', error)
    emit('notify', 'Unable to copy automatically. Select the link and copy it manually.')
  }
}

if (course.value) {
  course.value.stages.forEach(stage => computeStageMetrics(stage))
}
</script>
