<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { examApi, gradeApi, questionApi } from '@/api'
import type { Certificate, Exam } from '@/types'

const exams = ref<Exam[]>([])
const certs = ref<Certificate[]>([])
const examTotal = ref(0)
const publishedCount = ref(0)
const questionTotal = ref(0)
const loading = ref(true)
const error = ref('')

const statusLabel: Record<string, string> = {
  draft: '未发布',
  published: '进行中',
  ended: '已结束',
}

onMounted(async () => {
  try {
    const [examPage, publishedPage, certList, questionPage] = await Promise.all([
      examApi.list({ page: 1, page_size: 100 }),
      examApi.list({ page: 1, page_size: 1, status: 'published' }),
      gradeApi.certificates(),
      questionApi.list({ page: 1, page_size: 1 }),
    ])
    exams.value = examPage.items
    examTotal.value = examPage.total
    publishedCount.value = publishedPage.total
    certs.value = certList
    questionTotal.value = questionPage.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h2>📊 仪表盘</h2>
    <div v-if="error" class="error-msg">{{ error }}</div>
    <template v-else>
      <div class="card-grid">
        <div class="card stat-card">
          <div class="stat-num">{{ examTotal }}</div>
          <div class="stat-label">考试总数</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">{{ publishedCount }}</div>
          <div class="stat-label">进行中的考试</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">{{ questionTotal }}</div>
          <div class="stat-label">题库题目数</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">{{ certs.length }}</div>
          <div class="stat-label">我的证书</div>
        </div>
      </div>

      <h3>考试列表</h3>
      <div v-if="loading" class="loading-tip">加载中...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>考试名称</th>
            <th>时长</th>
            <th>总分/及格分</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in exams" :key="e.id">
            <td>{{ e.id }}</td>
            <td>{{ e.title }}</td>
            <td>{{ e.duration_minutes }} 分钟</td>
            <td>{{ e.total_score }} / {{ e.pass_score }}</td>
            <td><span class="badge" :class="`badge-${e.status}`">{{ statusLabel[e.status] || e.status }}</span></td>
            <td>
              <router-link v-if="e.status === 'published'" class="btn btn-sm btn-primary" :to="`/exam/${e.id}/take`">
                开始考试
              </router-link>
              <router-link class="btn btn-sm" :to="`/exams/${e.id}/stats`">统计</router-link>
            </td>
          </tr>
          <tr v-if="!exams.length">
            <td colspan="6" class="empty-tip">暂无考试</td>
          </tr>
        </tbody>
      </table>

      <template v-if="certs.length">
        <h3>我的证书</h3>
        <div class="card">
          <div v-for="c in certs" :key="c.id" class="cert-item">
            🏅 {{ c.certificate_no }} — 考试 #{{ c.exam_id }}，得分 {{ c.score }}
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
