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
      </div>
    </header>
    <section class="course-detail__actions">
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
            <button class="button button--ghost" type="button" @click="openStage(stage)">Start session</button>
            <button class="button button--primary" type="button" @click="manageStage(stage)">Manage cards</button>
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

function resetForm() {
  stageForm.title = ''
  stageForm.description = ''
  formError.value = ''
}

function createStage() {
  if (!course.value) {
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
  router.push({ name: 'StageSession', params: { courseId: course.value.id, stageId: stage.id } })
}

function manageStage(stage) {
  router.push({ name: 'StageDetail', params: { courseId: course.value.id, stageId: stage.id } })
}

if (course.value) {
  course.value.stages.forEach(stage => computeStageMetrics(stage))
}
</script>
