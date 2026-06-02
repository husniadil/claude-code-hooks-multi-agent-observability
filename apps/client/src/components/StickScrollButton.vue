<template>
  <button
    @click="$emit('toggle')"
    class="fixed bottom-6 right-6 mobile:bottom-4 mobile:right-4 w-11 h-11 rounded-full transition-colors duration-150 flex items-center justify-center border"
    :class="stickToBottom
      ? 'bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white border-[var(--theme-primary-hover)]'
      : 'bg-[var(--theme-bg-primary)] hover:bg-[var(--theme-bg-secondary)] text-[var(--theme-text-secondary)] border-[var(--theme-border-primary)]'"
    :style="{ boxShadow: '0 4px 14px -4px rgba(20, 20, 19, 0.2)' }"
    :title="stickToBottom ? 'Auto-scroll on — click to pause' : 'Auto-scroll off — click to follow'"
  >
    <ArrowDownToLine v-if="stickToBottom" :size="19" :stroke-width="1.85" />
    <ArrowDown v-else :size="19" :stroke-width="1.85" />
  </button>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowDownToLine } from 'lucide-vue-next';

defineProps<{
  stickToBottom: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>
