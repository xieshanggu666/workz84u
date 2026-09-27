<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { attemptApi } from '@/api'
import type { ExamQuestionBrief, ExamStartResponse, QuestionType } from '@/types'

const route = useRoute()
const router = useRouter()
const examId = Number(route.params.id)

const typeLabels: Record<QuestionType, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  judgment: '判断题',
  fill_blank: '填空题',
  short_answer: '简答题',
  programming: '编程题',
}

const attempt = ref<ExamStartResponse | null>(null)
const questions = ref<ExamQuestionBrief[]>([])
const error = ref('')
const submitting = ref(false)

/** 每题答案：按作答方式分别存储 */
const choiceAnswers = reactive<Record<number, string>>({}) // 单选 / 判断
const multiAnswers = reactive<Record<number, string[]>>({}) // 多选
const textAnswers = reactive<Record<number, string>>({}) // 填空 / 简答 / 编程
/** 每题开始作答的时间戳，用于统计单题用时 */
const questionStartTime: Record<number, number> = {}
const questionTimeSpent: Record<number, number> = {}

// ---------- 倒计时 ----------
const remainSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const timerText = computed(() => {
  const m = Math.floor(remainSeconds.value / 60)
  const s = remainSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function startTimer(minutes: number) {
  const endAt = Date.now() + minutes * 60 * 1000
  remainSeconds.value = minutes * 60
  timer = setInterval(() => {
    remainSeconds.value = Math.max(0, Math.round((endAt - Date.now()) / 1000))
    if (remainSeconds.value <= 0) {
      stopTimer()
      window.alert('考试时间到，自动交卷')
      submitAll()
    }
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// ---------- 防作弊：切屏检测 ----------
const cheatWarnings = ref(0)
let lastSwitchReport = 0

async function reportScreenSwitch() {
  if (!attempt.value || Date.now() - lastSwitchReport < 3000) return // 3 秒内只上报一次
  lastSwitchReport = Date.now()
  try {
    const data = await attemptApi.screenSwitch(attempt.value.attempt_id)
    cheatWarnings.value = data.warning
    if (data.force_submit) {
      window.alert('检测到多次切屏，系统已强制交卷！')
      await submitAll()
    }
  } catch {
    /* 网络错误忽略 */
  }
}

function onVisibilityChange() {
  if (document.hidden) reportScreenSwitch()
}

// ---------- 答题 ----------
function markTouched(questionId: number) {
  if (!(questionId in questionStartTime)) {
    questionStartTime[questionId] = Date.now()
  }
  questionTimeSpent[questionId] = Math.floor((Date.now() - questionStartTime[questionId]) / 1000)
}

async function submitAll() {
  if (!attempt.value || submitting.value) return
  submitting.value = true
  stopTimer()
  const answerList = questions.value.map((q) => {
    const raw =
      q.question_type === 'multiple_choice'
        ? (multiAnswers[q.question_id] || []).join(',')
        : choiceAnswers[q.question_id] ?? textAnswers[q.question_id] ?? ''
    return {
      question_id: q.question_id,
      user_answer: raw,
      time_spent_seconds: questionTimeSpent[q.question_id] || 0,
    }
  })
  try {
    await attemptApi.submit(attempt.value.attempt_id, answerList)
    router.replace(`/result/${attempt.value.attempt_id}`)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '交卷失败')
    submitting.value = false
  }
}

function confirmSubmit() {
  const answered = questions.value.filter((q) => {
    if (q.question_type === 'multiple_choice') return (multiAnswers[q.question_id] || []).length > 0
    return Boolean(choiceAnswers[q.question_id] || textAnswers[q.question_id])
  }).length
  const msg = answered < questions.value.length
    ? `还有 ${questions.value.length - answered} 题未作答，确定交卷？`
    : '确定交卷？'
  if (window.confirm(msg)) submitAll()
}

// ---------- 生命周期 ----------
onMounted(async () => {
  try {
    const data = await attemptApi.start(examId)
    attempt.value = data
    questions.value = data.questions
    startTimer(data.duration_minutes)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', reportScreenSwitch)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '无法开始考试'
  }
})

onBeforeUnmount(() => {
  stopTimer()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('blur', reportScreenSwitch)
})
</script>

<template>
  <div>
    <div class="exam-header">
      <div class="exam-title">{{ attempt?.title || '考试中' }}</div>
      <div class="exam-timer">剩余时间：<span class="timer-text">{{ timerText }}</span></div>
    </div>

    <main class="container exam-body">
      <div v-if="error" class="card">
        <p class="error-msg">{{ error }}</p>
        <div class="modal-actions">
          <router-link class="btn btn-primary" to="/exams">返回考试中心</router-link>
        </div>
      </div>

      <div v-else-if="!attempt" class="loading-tip">正在进入考试...</div>

      <template v-else>
        <div v-for="(q, idx) in questions" :key="q.question_id" class="card question-card">
          <div class="question-head">
            <span class="badge badge-type">{{ idx + 1 }}. {{ typeLabels[q.question_type] || q.question_type }}</span>
            <span class="badge">{{ q.score }} 分</span>
          </div>
          <div class="question-content">{{ q.content }}</div>

          <!-- 单选 / 判断 -->
          <template v-if="q.question_type === 'single_choice' || q.question_type === 'judgment'">
            <label v-for="opt in q.options" :key="opt.id" class="option-row">
              <input
                v-model="choiceAnswers[q.question_id]"
                type="radio"
                :name="`q${q.question_id}`"
                :value="String(opt.id)"
                @change="markTouched(q.question_id)"
              />
              <span>{{ opt.content }}</span>
            </label>
          </template>

          <!-- 多选 -->
          <template v-else-if="q.question_type === 'multiple_choice'">
            <label v-for="opt in q.options" :key="opt.id" class="option-row">
              <input
                v-model="multiAnswers[q.question_id]"
                type="checkbox"
                :name="`q${q.question_id}`"
                :value="String(opt.id)"
                @change="markTouched(q.question_id)"
              />
              <span>{{ opt.content }}</span>
            </label>
          </template>

          <!-- 填空 / 简答 / 编程 -->
          <textarea
            v-else
            v-model="textAnswers[q.question_id]"
            class="answer-textarea"
            placeholder="在此输入答案"
            @input="markTouched(q.question_id)"
          ></textarea>
        </div>
      </template>
    </main>

    <div v-if="attempt" class="exam-footer">
      <span v-if="cheatWarnings" class="cheat-warning">⚠️ 已检测到 {{ cheatWarnings }} 次切屏</span>
      <button class="btn btn-primary" :disabled="submitting" @click="confirmSubmit">
        {{ submitting ? '交卷中...' : '交卷' }}
      </button>
    </div>
  </div>
</template>
