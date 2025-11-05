<template>
  <section v-if="stage && course" class="stage-detail">
    <header class="stage-detail__header">
      <div>
        <h1>{{ stage.title }}</h1>
        <p>{{ stage.description || 'Describe what learners should achieve in this stage.' }}</p>
      </div>
      <div class="stage-detail__meta">
        <div>
          <span class="meta-label">Stage points</span>
          <span class="meta-value">{{ stage.points ?? 0 }}</span>
        </div>
        <div>
          <span class="meta-label">Cards</span>
          <span class="meta-value">{{ stage.metrics.total }}</span>
        </div>
        <div>
          <span class="meta-label">Due today</span>
          <span class="meta-value">{{ stage.metrics.due }}</span>
        </div>
      </div>
    </header>
    <section class="stage-detail__form">
      <h2>Add a new card</h2>
      <form class="inline-form" @submit.prevent="addCard">
        <div class="form-grid">
          <div class="form-field">
            <label for="card-front">Prompt</label>
            <textarea id="card-front" v-model="cardForm.front" rows="3" placeholder="Front of the card" required></textarea>
          </div>
          <div class="form-field">
            <label for="card-back">Answer</label>
            <textarea id="card-back" v-model="cardForm.back" rows="3" placeholder="Back of the card" required></textarea>
          </div>
        </div>
        <div class="form-field">
          <label for="card-note">Extra notes (optional)</label>
          <input id="card-note" v-model="cardForm.note" type="text" placeholder="Mnemonic, example sentence…" />
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <button class="button button--success" type="submit">Add card</button>
      </form>
    </section>
    <section class="stage-detail__cards">
      <header class="stage-detail__cards-header">
        <div>
          <h2>Cards</h2>
          <p>{{ cardsView.length }} card{{ cardsView.length === 1 ? '' : 's' }} in this stage.</p>
        </div>
        <div class="stage-detail__cards-actions">
          <router-link class="button button--ghost" :to="{ name: 'StageSession', params: { courseId: course.id, stageId: stage.id } }">
            Start revision
          </router-link>
        </div>
      </header>
      <p v-if="!cardsView.length" class="empty-state">No cards yet. Add your first one above.</p>
      <div v-else class="card-table-wrapper">
        <table class="card-table">
          <thead>
            <tr>
              <th scope="col">Prompt</th>
              <th scope="col">Answer</th>
              <th scope="col">Status</th>
              <th scope="col">Next review</th>
              <th scope="col">Mastery</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="card in cardsView" :key="card.id">
              <td>
                <p class="card-table__front">{{ card.front }}</p>
                <small v-if="card.note" class="card-table__note">{{ card.note }}</small>
              </td>
              <td>{{ card.back }}</td>
              <td>{{ card.status }}</td>
              <td>{{ card.due }}</td>
              <td>{{ card.mastery }}</td>
              <td>
                <button class="link-button" type="button" @click="removeCard(card.id)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
  <section v-else class="dashboard dashboard--empty">
    <div class="empty-card">
      <h1>Stage not found</h1>
      <p>The stage you were looking for was not found.</p>
      <router-link class="button button--primary" :to="{ name: 'Dashboard' }">Back to dashboard</router-link>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { currentUser, useAuth } from '../composables/useAuth'
import { createId } from '../utils/id'
import { computeStageMetrics } from '../utils/srs'

const emit = defineEmits(['notify'])
const route = useRoute()
const { updateCurrentUser } = useAuth()

const cardForm = reactive({
  front: '',
  back: '',
  note: ''
})
const formError = ref('')

const course = computed(() => {
  const courseId = route.params.courseId
  return currentUser.value?.courses.find(item => item.id === courseId) ?? null
})

const stage = computed(() => {
  const stageId = route.params.stageId
  return course.value?.stages.find(item => item.id === stageId) ?? null
})

const cardsView = computed(() => {
  if (!stage.value) {
    return []
  }
  return [...stage.value.cards].map(card => ({
    id: card.id,
    front: card.front,
    back: card.back,
    note: card.note,
    status: card.due ? (new Date(card.due).getTime() <= Date.now() ? 'Due' : 'Scheduled') : 'New',
    due: formatDue(card.due),
    mastery: `${Math.round((card.mastery || 0))}%`
  }))
})

function formatDue(date) {
  if (!date) {
    return 'New card'
  }
  const dueDate = new Date(date)
  if (Number.isNaN(dueDate.getTime())) {
    return 'Unknown'
  }
  const now = Date.now()
  const diff = dueDate.getTime() - now
  if (diff <= 0) {
    return 'Due now'
  }
  const days = Math.round(diff / 86400000)
  if (days === 0) {
    return 'Later today'
  }
  if (days === 1) {
    return 'Tomorrow'
  }
  return `In ${days} days`
}

function resetForm() {
  cardForm.front = ''
  cardForm.back = ''
  cardForm.note = ''
  formError.value = ''
}

function addCard() {
  if (!stage.value || !course.value) {
    return
  }
  if (!cardForm.front.trim() || !cardForm.back.trim()) {
    formError.value = 'Both sides of the card are required.'
    return
  }
  updateCurrentUser(user => {
    const targetCourse = user.courses.find(item => item.id === course.value.id)
    if (!targetCourse) {
      return
    }
    const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
    if (!targetStage) {
      return
    }
    targetStage.cards.push({
      id: createId(),
      front: cardForm.front.trim(),
      back: cardForm.back.trim(),
      note: cardForm.note.trim(),
      createdAt: new Date().toISOString(),
      status: 'new',
      history: [],
      mastery: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      due: null
    })
    computeStageMetrics(targetStage)
  })
  emit('notify', 'Card added to the stage!')
  resetForm()
}

function removeCard(cardId) {
  if (!stage.value || !course.value) {
    return
  }
  updateCurrentUser(user => {
    const targetCourse = user.courses.find(item => item.id === course.value.id)
    if (!targetCourse) {
      return
    }
    const targetStage = targetCourse.stages.find(item => item.id === stage.value.id)
    if (!targetStage) {
      return
    }
    targetStage.cards = targetStage.cards.filter(card => card.id !== cardId)
    computeStageMetrics(targetStage)
  })
  emit('notify', 'Card removed.')
}
</script>
