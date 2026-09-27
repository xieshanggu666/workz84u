<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-body">
    <div class="login-card">
      <h1>📝 在线考试与题库系统</h1>
      <form @submit.prevent="onSubmit">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" required placeholder="admin / teacher / student1" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" required placeholder="123456" />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
        <div class="error-msg">{{ error }}</div>
      </form>
      <div class="login-tip">示例账号：admin/123456、teacher/123456、student1/123456</div>
    </div>
  </div>
</template>
