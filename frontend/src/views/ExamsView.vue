<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { examApi, questionApi } from '@/api'
import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/stores/auth'
import type { Exam, ExamStatus, Subject } from '@/types'

const auth = useAuthStore()

const statusTabs: { value: ExamStatus; label: string }[] = [
  { value: 'published', label: '进行中' },
  { value: 'draft', label: '未发布' },
  { value: 'ended', label: '已结束' },
]
const statusLabel: Record<string, string> = {
  draft: '未发布',
  published: '进行中',
  ended: '已结束',
}
const examTypeLabel: Record<string, string> = {
  formal: '正式考试',
  practice: '练习',
  mock: '模拟考',
}

const currentStatus = ref<ExamStatus>('published')
const exams = ref<Exam[]>([])
const loading = ref(false)
const error = ref('')

// ---------- 创建考试表单 ----------
const showModal = ref(false)
const saving = ref(false)
const subjects = ref<Subject[]>([])
const form = reactive({
  title: '',
  subject_id: 1,
  duration_minutes: 60,
  total_score: 100,
  pass_score: 60,
  exam_type: 'formal',
  anti_cheat_enabled: 1,
})

async function loadExams(status: ExamStatus = currentStatus.value) {
  currentStatus.value = status
  loading.value = true
  error.value = ''
  try {
    const data = await examApi.list({ page: 1, page_size: 100, status })
    exams.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function publish(id: number) {
  try {
    await examApi.update(id, { status: 'published' })
    loadExams()
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '发布失败')
  }
}

async function openModal() {
  showModal.value = true
  if (!subjects.value.length) {
    subjects.value = await questionApi.subjects()
    if (subjects.value.length && !subjects.value.some((s) => s.id === form.subject_id)) {
      form.subject_id = subjects.value[0].id
    }
  }
}

async function create() {
  if (!form.title.trim()) {
    window.alert('请填写考试名称')
    return
  }
  saving.value = true
  try {
    await examApi.create({ ...form, title: form.title.trim() })
    showModal.value = false
    window.alert('考试已创建，请到题库添加题目后发布')
    loadExams('draft')
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '创建失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => loadExams('published'))
</script>

<template>
  <div>
    <h2>🎯 考试中心</h2>

    <div class="toolbar">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="btn"
        :class="{ 'btn-primary': currentStatus === tab.value }"
        @click="loadExams(tab.value)"
      >
        {{ tab.label }}
      </button>
      <span class="spacer"></span>
      <button v-if="auth.canManage" class="btn btn-primary" @click="openModal">+ 创建考试</button>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
    <div v-if="loading" class="loading-tip">加载中...</div>
    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>考试名称</th>
          <th>类型</th>
          <th>时长</th>
          <th>总分</th>
          <th>及格分</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in exams" :key="e.id">
          <td>{{ e.id }}</td>
          <td>{{ e.title }}</td>
          <td>{{ examTypeLabel[e.exam_type] || e.exam_type }}</td>
          <td>{{ e.duration_minutes }} 分钟</td>
          <td>{{ e.total_score }}</td>
          <td>{{ e.pass_score }}</td>
          <td><span class="badge" :class="`badge-${e.status}`">{{ statusLabel[e.status] || e.status }}</span></td>
          <td>
            <router-link v-if="e.status === 'published'" class="btn btn-sm btn-primary" :to="`/exam/${e.id}/take`">
              开始考试
            </router-link>
            <button v-if="auth.canManage && e.status === 'draft'" class="btn btn-sm" @click="publish(e.id)">
              发布
            </button>
            <router-link class="btn btn-sm" :to="`/exams/${e.id}/stats`">统计</router-link>
          </td>
        </tr>
        <tr v-if="!exams.length">
          <td colspan="8" class="empty-tip">暂无考试</td>
        </tr>
      </tbody>
    </table>

    <AppModal :visible="showModal" title="创建考试" @close="showModal = false">
      <div class="form-group">
        <label>名称</label>
        <input v-model="form.title" placeholder="请输入考试名称" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>科目</label>
          <select v-model.number="form.subject_id">
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>类型</label>
          <select v-model="form.exam_type">
            <option value="formal">正式考试</option>
            <option value="practice">练习</option>
            <option value="mock">模拟考</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>时长（分钟）</label>
          <input v-model.number="form.duration_minutes" type="number" min="1" />
        </div>
        <div class="form-group">
          <label>总分</label>
          <input v-model.number="form.total_score" type="number" min="1" />
        </div>
        <div class="form-group">
          <label>及格分</label>
          <input v-model.number="form.pass_score" type="number" min="0" />
        </div>
      </div>
      <div class="form-group">
        <label>
          <input v-model="form.anti_cheat_enabled" type="checkbox" :true-value="1" :false-value="0" />
          开启防作弊（切屏检测）
        </label>
      </div>
      <template #actions>
        <button class="btn btn-primary" :disabled="saving" @click="create">
          {{ saving ? '创建中...' : '创建' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>
