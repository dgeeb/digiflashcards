<template>
  <section class="dashboard dashboard--empty join-course">
    <div class="empty-card">
      <h1>Joining course</h1>
      <p>{{ statusMessage }}</p>
      <router-link v-if="!joining" class="button button--primary" :to="{ name: 'Dashboard' }">Go to dashboard</router-link>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { joinSharedCourse } = useAuth()

const statusMessage = ref('We are preparing the shared course for you…')
const joining = ref(true)

onMounted(async () => {
  const code = route.params.shareCode
  try {
    await joinSharedCourse(code)
    statusMessage.value = 'Course added to your student dashboard. Redirecting…'
    joining.value = false
    window.setTimeout(() => {
      router.replace({ name: 'Dashboard' })
    }, 1800)
  } catch (error) {
    statusMessage.value = error?.message || 'We could not join this course. Please double-check the link.'
    joining.value = false
  }
})
</script>
