<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { questionApi } from '@/api'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useAuthStore } from '@/stores/auth'
import type { KnowledgePoint, QuestionListItem, QuestionType, Subject } from '@/types'

const auth = useAuthStore()
const PAGE_SIZE = 10

const typeLabels: Record<QuestionType, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  judgment: '判断题',
  fill_blank: '填空题',
  short_answer: '简答题',
  programming: '编程题',
}
const typeOptions = Object.entries(typeLabels) as [QuestionType, string][]

const items = ref<QuestionListItem[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const error = ref('')

const filters = reactive({
  question_type: '' as QuestionType | '',
  keyword: '',
})

// ---------- 新增题目表单 ----------
const showModal = ref(false)
const saving = ref(false)
const subjects = ref<Subject[]>([])
const knowledgePoints = ref<KnowledgePoint[]>([])

const form = reactive({
  question_type: 'single_choice' as QuestionType,
  content: '',
  difficulty: 3,
  subject_id: 1,
  knowledge_point_id: 1,
  analysis: '',
  optionsText: '',
})

/** 选择题/判断题需要填写选项 */
const needOptions = computed(() =>
  ['single_choice', 'multiple_choice', 'judgment'].includes(form.question_type),
)

async function loadList(p = page.value) {
  loading.value = true
  error.value = ''
  try {
    const data = await questionApi.list({
      page: p,
      page_size: PAGE_SIZE,
      question_type: filters.question_type,
      keyword: filters.keyword.trim(),
    })
    items.value = data.items
    total.value = data.total
    page.value = data.page
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function search() {
  loadList(1)
}

async function remove(id: number) {
  if (!window.confirm('确定删除该题目？')) return
  try {
    await questionApi.remove(id)
    // 删除后若当前页已空则回退一页
    const target = items.value.length === 1 && page.value > 1 ? page.value - 1 : page.value
    loadList(target)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '删除失败')
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
  await loadKnowledgePoints()
}

async function loadKnowledgePoints() {
  knowledgePoints.value = await questionApi.knowledgePoints(form.subject_id)
  if (knowledgePoints.value.length) {
    form.knowledge_point_id = knowledgePoints.value[0].id
  }
}

async function save() {
  if (!form.content.trim()) {
    window.alert('请填写题目内容')
    return
  }
  const options = form.optionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [content = '', flag = '0'] = line.split('@')
      return { content: content.trim(), is_correct: parseInt(flag) || 0, order_index: i }
    })
  if (needOptions.value && !options.length) {
    window.alert('请填写选项，每行一个，格式：内容@是否正确(0/1)')
    return
  }
  saving.value = true
  try {
    await questionApi.create({
      question_type: form.question_type,
      content: form.content.trim(),
      analysis: form.analysis,
      difficulty: form.difficulty,
      knowledge_point_id: form.knowledge_point_id,
      subject_id: form.subject_id,
      options,
    })
    showModal.value = false
    loadList(1)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => loadList(1))
</script>

<template>
  <div>
    <h2>📚 题库管理</h2>

    <div class="toolbar">
      <select v-model="filters.question_type" @change="search">
        <option value="">全部题型</option>
        <option v-for="[value, label] in typeOptions" :key="value" :value="value">{{ label }}</option>
      </select>
      <input v-model="filters.keyword" type="text" placeholder="搜索题目内容" @keyup.enter="search" />
      <button class="btn btn-primary" @click="search">搜索</button>
      <span class="spacer"></span>
      <button v-if="auth.canManage" class="btn" @click="openModal">+ 新增题目</button>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
    <div v-if="loading" class="loading-tip">加载中...</div>
    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>题型</th>
          <th>题目</th>
          <th>难度</th>
          <th v-if="auth.canManage">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="q in items" :key="q.id">
          <td>{{ q.id }}</td>
          <td><span class="badge badge-type">{{ typeLabels[q.question_type] || q.question_type }}</span></td>
          <td>{{ q.content.slice(0, 40) }}{{ q.content.length > 40 ? '…' : '' }}</td>
          <td>{{ '★'.repeat(q.difficulty) }}{{ '☆'.repeat(5 - q.difficulty) }}</td>
          <td v-if="auth.canManage">
            <button class="btn btn-sm btn-danger" @click="remove(q.id)">删除</button>
          </td>
        </tr>
        <tr v-if="!items.length">
          <td :colspan="auth.canManage ? 5 : 4" class="empty-tip">暂无题目</td>
        </tr>
      </tbody>
    </table>

    <AppPagination :page="page" :page-size="PAGE_SIZE" :total="total" @change="loadList" />

    <AppModal :visible="showModal" title="新增题目" @close="showModal = false">
      <div class="form-row">
        <div class="form-group">
          <label>题型</label>
          <select v-model="form.question_type">
            <option v-for="[value, label] in typeOptions" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>难度 (1-5)</label>
          <input v-model.number="form.difficulty" type="number" min="1" max="5" />
        </div>
      </div>
      <div class="form-group">
        <label>题目内容</label>
        <textarea v-model="form.content" rows="3"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>科目</label>
          <select v-model.number="form.subject_id" @change="loadKnowledgePoints">
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>知识点</label>
          <select v-model.number="form.knowledge_point_id">
            <option v-for="kp in knowledgePoints" :key="kp.id" :value="kp.id">{{ kp.name }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>答案解析 / 标准答案（填空、简答关键词以 | 分隔）</label>
        <textarea v-model="form.analysis" rows="2" placeholder="填空标准答案或简答关键词用 | 分隔"></textarea>
      </div>
      <div v-if="needOptions" class="form-group">
        <label>选项（每行一个，格式：内容@是否正确0/1）</label>
        <textarea v-model="form.optionsText" rows="4" placeholder="A选项@1&#10;B选项@0&#10;C选项@0&#10;D选项@0"></textarea>
      </div>
      <template #actions>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>
