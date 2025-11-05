import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated } from '../composables/useAuth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/forgot',
      name: 'ForgotPassword',
      component: () => import('../views/ForgotPassword.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/courses/:courseId',
      name: 'CourseDetail',
      component: () => import('../views/CourseDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/courses/:courseId/stages/:stageId',
      name: 'StageDetail',
      component: () => import('../views/StageDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/courses/:courseId/stages/:stageId/session',
      name: 'StageSession',
      component: () => import('../views/StageSession.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'Dashboard' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authed = isAuthenticated()
  if (to.meta.requiresAuth && !authed) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guestOnly && authed) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
