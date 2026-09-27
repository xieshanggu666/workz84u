import { defineStore } from 'pinia'

import { authApi } from '@/api'
import type { User } from '@/types'

const TOKEN_KEY = 'access_token'
const USER_KEY = 'user_info'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: loadUser() as User | null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    /** 管理员 / 教师可管理题库与考试 */
    canManage: (state) => state.user?.role === 'admin' || state.user?.role === 'teacher',
  },
  actions: {
    async login(username: string, password: string) {
      const data = await authApi.login(username, password)
      this.token = data.access_token
      this.user = data.user
      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})
