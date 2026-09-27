import type { APIResponse } from '@/types'

const BASE_URL = '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken(): string {
  return localStorage.getItem('access_token') || ''
}

function handleUnauthorized(): never {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_info')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
  throw new ApiError(401, '登录已过期，请重新登录')
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, '网络错误，请检查后端服务是否已启动')
  }

  if (res.status === 401) {
    handleUnauthorized()
  }

  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = payload?.detail
    const message =
      typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : `请求失败 (${res.status})`
    throw new ApiError(res.status, message)
  }
  return (payload as APIResponse<T>).data as T
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const http = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
}
