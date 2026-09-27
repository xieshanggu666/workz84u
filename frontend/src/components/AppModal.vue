<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div v-if="visible" class="modal" @click.self="emit('close')">
    <div class="modal-content">
      <h3>{{ title }}</h3>
      <slot />
      <div class="modal-actions">
        <slot name="actions" />
        <button class="btn" @click="emit('close')">取消</button>
      </div>
    </div>
  </div>
</template>
