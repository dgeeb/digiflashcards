<template>
  <section class="auth-page">
    <article class="auth-card">
      <header class="auth-card__header">
        <h1>Reset your password</h1>
        <p>Answer your secret question to create a new password.</p>
      </header>
      <form class="auth-card__form" @submit.prevent="submit">
        <div class="form-field">
          <label for="forgot-email">Email</label>
          <input id="forgot-email" v-model="form.email" type="email" autocomplete="email" required :disabled="step === 2" />
        </div>
        <div v-if="step === 2" class="form-field">
          <label for="forgot-answer">{{ question }}</label>
          <input id="forgot-answer" v-model="form.answer" type="text" required />
        </div>
        <div v-if="step === 2" class="form-field">
          <label for="forgot-new">New password</label>
          <input id="forgot-new" v-model="form.password" type="password" autocomplete="new-password" required />
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="button button--primary" type="submit" :disabled="loading">
          <template v-if="step === 1">
            {{ loading ? 'Looking up…' : 'Find my question' }}
          </template>
          <template v-else>
            {{ loading ? 'Updating…' : 'Reset password' }}
          </template>
        </button>
      </form>
      <div class="auth-card__links">
        <router-link :to="{ name: 'Login' }">Back to login</router-link>
      </div>
    </article>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['notify'])
const router = useRouter()
const { getSecretQuestion, resetPassword } = useAuth()

const step = ref(1)
const question = ref('')
const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  answer: '',
  password: ''
})

async function submit() {
  if (loading.value) {
    return
  }
  error.value = ''
  loading.value = true
  try {
    if (step.value === 1) {
      question.value = getSecretQuestion(form.email)
      step.value = 2
      emit('notify', 'We found your question. Answer it to continue.')
    } else {
      await resetPassword(form.email, form.answer, form.password)
      emit('notify', 'Password updated. See you soon!')
      router.push({ name: 'Login' })
    }
  } catch (exception) {
    error.value = exception?.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
