<template>
  <Transition name="toast">
    <div
      v-if="isVisible"
      class="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 pl-3 pr-1.5 py-2 bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] rounded-lg border border-[var(--theme-border-primary)] transition-all duration-300"
      :style="{
        top: `${16 + (index * 56)}px`,
        boxShadow: '0 6px 20px -6px rgba(20, 20, 19, 0.18)'
      }"
    >
      <span
        class="w-2 h-2 rounded-full shrink-0"
        :style="{ backgroundColor: agentColor }"
      ></span>
      <span class="text-sm">
        New agent <span class="font-mono font-medium text-[var(--theme-text-primary)]">{{ agentName }}</span> joined
      </span>
      <button
        @click="dismiss"
        class="ml-1 p-1 rounded text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] transition-colors"
        aria-label="Dismiss notification"
      >
        <X :size="15" :stroke-width="2" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps<{
  agentName: string;
  agentColor: string;
  index: number;
  duration?: number;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const isVisible = ref(false);
let dismissTimer: number | null = null;

const dismiss = () => {
  isVisible.value = false;
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  // Wait for animation to complete before emitting
  setTimeout(() => {
    emit('dismiss');
  }, 300);
};

onMounted(() => {
  // Show toast with slight delay for animation
  requestAnimationFrame(() => {
    isVisible.value = true;
  });

  // Auto-dismiss after duration (default 4s)
  const totalDuration = props.duration || 4000;
  dismissTimer = window.setTimeout(() => {
    dismiss();
  }, totalDuration);
});

onUnmounted(() => {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
  }
});
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
