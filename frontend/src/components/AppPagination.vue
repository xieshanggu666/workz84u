<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

function go(page: number) {
  if (page < 1 || page > totalPages.value || page === props.page) return
  emit('change', page)
}
</script>

<template>
  <div class="pagination">
    <button class="btn btn-sm" :disabled="page <= 1" @click="go(page - 1)">上一页</button>
    <span>{{ page }}/{{ totalPages }}（共 {{ total }} 条）</span>
    <button class="btn btn-sm" :disabled="page >= totalPages" @click="go(page + 1)">下一页</button>
  </div>
</template>
