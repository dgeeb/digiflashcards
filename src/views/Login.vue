<template>
  <section class="auth-page">
    <article class="auth-card">
      <header class="auth-card__header">
        <h1>Welcome back</h1>
        <p>Sign in to see today&apos;s spaced repetition session.</p>
      </header>
      <form class="auth-card__form" @submit.prevent="submit">
        <div class="form-field">
          <label for="login-email">Email</label>
          <input id="login-email" v-model="form.email" type="email" autocomplete="email" required />
        </div>
        <div class="form-field">
          <label for="login-password">Password</label>
          <input id="login-password" v-model="form.password" type="password" autocomplete="current-password" required />
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="button button--primary" type="submit" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
      <div class="auth-card__links">
        <router-link :to="{ name: 'Register' }">Need an account?</router-link>
        <router-link :to="{ name: 'ForgotPassword' }">Forgot password?</router-link>
      </div>
    </article>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['notify'])
const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const form = reactive({
  email: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

async function submit() {
  if (loading.value) {
    return
  }
  error.value = ''
  loading.value = true
  try {
    await login(form.email, form.password)
    emit('notify', 'Welcome back! Ready for today\'s session?')
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect) {
      router.push(redirect)
    } else {
      router.push({ name: 'Dashboard' })
    }
  } catch (exception) {
    error.value = exception?.message || 'Unable to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
