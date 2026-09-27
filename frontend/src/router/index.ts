import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, bare: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('@/views/QuestionsView.vue'),
    },
    {
      path: '/exams',
      name: 'exams',
      component: () => import('@/views/ExamsView.vue'),
    },
    {
      path: '/exams/:id/stats',
      name: 'exam-stats',
      component: () => import('@/views/ExamStatsView.vue'),
    },
    {
      path: '/exam/:id/take',
      name: 'exam-take',
      component: () => import('@/views/ExamTakeView.vue'),
      meta: { bare: true },
    },
    {
      path: '/result/:attemptId',
      name: 'exam-result',
      component: () => import('@/views/ExamResultView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')
  if (!to.meta.public && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
