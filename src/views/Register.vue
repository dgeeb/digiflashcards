<template>
  <section class="auth-page">
    <article class="auth-card">
      <header class="auth-card__header">
        <h1>Create your study space</h1>
        <p>Design courses, build stages and let spaced repetition guide your learning.</p>
      </header>
      <form class="auth-card__form" @submit.prevent="submit">
        <div class="form-field">
          <label for="register-name">Display name</label>
          <input id="register-name" v-model="form.displayName" type="text" autocomplete="name" />
        </div>
        <div class="form-field">
          <label for="register-email">Email</label>
          <input id="register-email" v-model="form.email" type="email" autocomplete="email" required />
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label for="register-password">Password</label>
            <input id="register-password" v-model="form.password" type="password" autocomplete="new-password" required />
          </div>
          <div class="form-field">
            <label for="register-confirm">Confirm password</label>
            <input id="register-confirm" v-model="form.confirm" type="password" autocomplete="new-password" required />
          </div>
        </div>
        <div class="form-field">
          <label for="register-question">Secret question</label>
          <select id="register-question" v-model="form.secretQuestion" required>
            <option v-for="question in secretQuestions" :key="question" :value="question">
              {{ question }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label for="register-answer">Secret answer</label>
          <input id="register-answer" v-model="form.secretAnswer" type="text" required />
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="button button--primary" type="submit" :disabled="loading">
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>
      <div class="auth-card__links">
        <router-link :to="{ name: 'Login' }">Already have an account?</router-link>
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
const { register, secretQuestions } = useAuth()

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  confirm: '',
  secretQuestion: secretQuestions[0],
  secretAnswer: ''
})

const loading = ref(false)
const error = ref('')

async function submit() {
  if (loading.value) {
    return
  }
  error.value = ''
  if (form.password !== form.confirm) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await register({
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      secretQuestion: form.secretQuestion,
      secretAnswer: form.secretAnswer
    })
    emit('notify', 'Account created! Let\'s craft your first course.')
    router.push({ name: 'Dashboard' })
  } catch (exception) {
    error.value = exception?.message || 'Unable to create the account. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
