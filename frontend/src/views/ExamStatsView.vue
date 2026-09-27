<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { gradeApi } from '@/api'
import type { ExamStats, LeaderboardItem } from '@/types'

const route = useRoute()
const examId = Number(route.params.id)

const stats = ref<ExamStats | null>(null)
const leaderboard = ref<LeaderboardItem[]>([])
const error = ref('')
const loading = ref(true)

const distributionEntries = computed(() => {
  if (!stats.value) return []
  const entries = Object.entries(stats.value.distribution)
  const max = Math.max(1, ...entries.map(([, count]) => count))
  return entries.map(([range, count]) => ({
    range,
    count,
    width: `${Math.round((count / max) * 100)}%`,
  }))
})

function formatTime(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

onMounted(async () => {
  try {
    const [s, l] = await Promise.all([gradeApi.stats(examId), gradeApi.leaderboard(examId)])
    stats.value = s
    leaderboard.value = l
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h2>📈 考试统计 #{{ examId }}</h2>

    <div v-if="loading" class="loading-tip">加载中...</div>
    <div v-else-if="error" class="card">
      <p class="error-msg">{{ error }}</p>
      <div class="modal-actions">
        <router-link class="btn btn-primary" to="/exams">返回考试中心</router-link>
      </div>
    </div>

    <template v-else-if="stats">
      <div class="card-grid" style="grid-template-columns: repeat(5, 1fr)">
        <div class="card stat-card">
          <div class="stat-num">{{ stats.attempt_count }}</div>
          <div class="stat-label">参考人数</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">{{ stats.avg_score }}</div>
          <div class="stat-label">平均分</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">{{ stats.max_score }}</div>
          <div class="stat-label">最高分</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">{{ stats.min_score }}</div>
          <div class="stat-label">最低分</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">{{ stats.pass_rate }}%</div>
          <div class="stat-label">及格率</div>
        </div>
      </div>

      <h3>分数分布</h3>
      <div class="card">
        <div v-if="!distributionEntries.length" class="empty-tip">暂无数据</div>
        <div v-for="d in distributionEntries" :key="d.range" class="dist-row">
          <span class="dist-label">{{ d.range }} 分</span>
          <div class="dist-bar" :style="{ width: d.width }"></div>
          <span class="dist-count">{{ d.count }} 人</span>
        </div>
      </div>

      <h3>排行榜</h3>
      <table class="table">
        <thead>
          <tr>
            <th>名次</th>
            <th>考生</th>
            <th>分数</th>
            <th>交卷时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in leaderboard" :key="item.user_id">
            <td>{{ item.rank }}</td>
            <td>{{ item.real_name }}（{{ item.username }}）</td>
            <td>{{ item.score }}</td>
            <td>{{ formatTime(item.submit_time) }}</td>
          </tr>
          <tr v-if="!leaderboard.length">
            <td colspan="4" class="empty-tip">暂无成绩</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>
