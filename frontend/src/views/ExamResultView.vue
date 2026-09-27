<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { attemptApi, gradeApi, questionApi } from '@/api'
import type { Certificate, ExamResultResponse } from '@/types'

const route = useRoute()
const attemptId = Number(route.params.attemptId)

const result = ref<ExamResultResponse | null>(null)
const questionContents = ref<Record<number, string>>({})
const certificate = ref<Certificate | null>(null)
const error = ref('')
const loading = ref(true)
const generating = ref(false)

const passText = computed(() => (result.value?.is_passed ? '✅ 恭喜，已通过考试' : '❌ 未通过考试'))

onMounted(async () => {
  try {
    const data = await attemptApi.result(attemptId)
    result.value = data
    // 拉取题目内容用于答题回顾
    const ids = [...new Set(data.answers.map((a) => a.question_id))]
    const details = await Promise.allSettled(ids.map((id) => questionApi.detail(id)))
    details.forEach((r, i) => {
      if (r.status === 'fulfilled') questionContents.value[ids[i]] = r.value.content
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})

async function generateCertificate() {
  if (!result.value || generating.value) return
  generating.value = true
  try {
    certificate.value = await gradeApi.generateCertificate(result.value.exam_id)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '证书生成失败')
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div>
    <h2>📄 考试结果</h2>

    <div v-if="loading" class="loading-tip">加载中...</div>
    <div v-else-if="error" class="card">
      <p class="error-msg">{{ error }}</p>
      <div class="modal-actions">
        <router-link class="btn btn-primary" to="/">返回仪表盘</router-link>
      </div>
    </div>

    <template v-else-if="result">
      <div class="card" style="text-align: center; margin-bottom: 16px">
        <div class="result-score">{{ result.score }} / {{ result.total_score }} 分</div>
        <div class="result-meta">
          <span class="badge" :class="result.is_passed ? 'badge-pass' : 'badge-fail'">{{ passText }}</span>
        </div>
        <div v-if="result.rank" class="result-meta">
          排名：第 {{ result.rank }} 名（超过 {{ result.percentile }}% 的考生）
        </div>
        <div v-if="certificate" class="cert-item">🏅 证书编号：{{ certificate.certificate_no }}</div>
        <button
          v-else-if="result.is_passed"
          class="btn btn-primary"
          :disabled="generating"
          @click="generateCertificate"
        >
          {{ generating ? '生成中...' : '生成证书' }}
        </button>
      </div>

      <h3>答题详情</h3>
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>题目</th>
            <th>我的答案</th>
            <th>结果</th>
            <th>得分</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(a, i) in result.answers" :key="a.id">
            <td>{{ i + 1 }}</td>
            <td>{{ questionContents[a.question_id]?.slice(0, 30) || `题目 #${a.question_id}` }}</td>
            <td>{{ a.user_answer || '（未作答）' }}</td>
            <td>
              <span class="badge" :class="a.is_correct ? 'badge-pass' : 'badge-fail'">
                {{ a.is_correct ? '正确' : '错误' }}
              </span>
            </td>
            <td>{{ a.score }}</td>
          </tr>
          <tr v-if="!result.answers.length">
            <td colspan="5" class="empty-tip">无答题记录</td>
          </tr>
        </tbody>
      </table>

      <div class="modal-actions" style="margin-top: 16px">
        <router-link class="btn btn-primary" to="/">返回仪表盘</router-link>
        <router-link class="btn" to="/exams">考试中心</router-link>
      </div>
    </template>
  </div>
</template>
