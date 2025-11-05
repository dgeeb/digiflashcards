<template>
  <div class="app-shell">
    <header class="app-header" :class="{ 'app-header--guest': !isAuthenticated }">
      <div class="brand" role="banner">
        <router-link class="brand__link" :to="isAuthenticated ? { name: 'Dashboard' } : { name: 'Login' }">
          <span class="brand__title">DigiSRS</span>
          <span class="brand__subtitle">powered by Digiflashcards</span>
        </router-link>
      </div>
      <nav v-if="isAuthenticated" class="app-nav" aria-label="Main navigation">
        <router-link class="app-nav__link" :to="{ name: 'Dashboard' }">Dashboard</router-link>
        <button type="button" class="app-nav__logout" @click="handleLogout">Logout</button>
      </nav>
      <div v-else class="guest-links">
        <router-link class="app-nav__link" :to="{ name: 'Login' }">Login</router-link>
        <router-link class="app-nav__link" :to="{ name: 'Register' }">Create account</router-link>
      </div>
      <div v-if="isAuthenticated" class="profile" role="presentation">
        <div class="profile__name">{{ displayName }}</div>
        <div class="profile__points" aria-label="Total points">{{ totalPoints }} pts</div>
      </div>
    </header>
    <transition name="banner">
      <div v-if="bannerMessage" class="app-banner" role="status">{{ bannerMessage }}</div>
    </transition>
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <component :is="Component" @notify="openBanner" />
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, useAuth } from './composables/useAuth'

const router = useRouter()
const { logout } = useAuth()
const bannerMessage = ref('')

const isAuthenticated = computed(() => Boolean(currentUser.value))
const displayName = computed(() => currentUser.value?.displayName ?? '')
const totalPoints = computed(() => currentUser.value?.points ?? 0)

function handleLogout() {
  logout()
  router.push({ name: 'Login' })
}

function openBanner(message) {
  if (!message) {
    return
  }
  bannerMessage.value = message
  window.clearTimeout(openBanner.timeout)
  openBanner.timeout = window.setTimeout(() => {
    bannerMessage.value = ''
  }, 4000)
}
</script>

<style src="destyle.css/destyle.css"></style>
<style src="@/assets/css/style.css"></style>
