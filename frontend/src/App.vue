<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

/** 登录页、答题页不显示导航框架 */
const bare = computed(() => Boolean(route.meta.bare))

const roleLabel = computed(() => {
  const map: Record<string, string> = { admin: '管理员', teacher: '教师', student: '学生' }
  return auth.user ? map[auth.user.role] || auth.user.role : ''
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <router-view v-if="bare" />
  <template v-else>
    <nav class="topbar">
      <div class="brand">📝 在线考试与题库系统</div>
      <div class="nav-links">
        <router-link to="/" exact-active-class="active">仪表盘</router-link>
        <router-link to="/questions" active-class="active">题库管理</router-link>
        <router-link to="/exams" active-class="active">考试中心</router-link>
        <span v-if="auth.user" class="user-info">{{ auth.user.real_name }}（{{ roleLabel }}）</span>
        <a href="javascript:void(0)" @click="logout">退出登录</a>
      </div>
    </nav>
    <main class="container">
      <router-view />
    </main>
  </template>
</template>
