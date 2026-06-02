<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 transition-opacity"
        style="background-color: rgba(20, 20, 19, 0.4)"
        @click="close"
      ></div>

      <!-- Modal -->
      <div
        ref="modalRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-manager-title"
        tabindex="-1"
        class="relative bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)] rounded-xl flex flex-col overflow-hidden z-10 focus:outline-none"
        style="width: 75vw; height: 75vh; box-shadow: 0 24px 60px -12px rgba(20, 20, 19, 0.35)"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 bg-[var(--theme-bg-primary)] border-b border-[var(--theme-border-primary)] p-5">
          <div class="flex items-center justify-between">
            <h2 id="theme-manager-title" class="inline-flex items-center gap-2 font-display text-2xl leading-none text-[var(--theme-text-primary)] tracking-tight">
              <Palette :size="20" :stroke-width="1.75" class="text-[var(--theme-text-tertiary)]" />
              Themes
            </h2>
            <button
              @click="close"
              class="p-2 rounded-lg text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] transition-colors"
              aria-label="Close"
            >
              <X :size="20" :stroke-width="2" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 p-5 overflow-y-auto bg-[var(--theme-bg-secondary)]">
          <!-- Theme Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <div
              v-for="theme in predefinedThemes"
              :key="theme.name"
              @click="selectTheme(theme.name)"
              :class="[
                'cursor-pointer rounded-xl border p-4 transition-colors bg-[var(--theme-bg-primary)]',
                currentTheme === theme.name
                  ? 'border-[var(--theme-primary)] ring-1 ring-[var(--theme-primary)]/30'
                  : 'border-[var(--theme-border-primary)] hover:border-[var(--theme-border-secondary)]'
              ]"
            >
              <!-- Theme Preview -->
              <div class="flex h-14 rounded-lg overflow-hidden mb-3 border border-[var(--theme-border-primary)]">
                <div class="flex-1" :style="{ backgroundColor: theme.preview.primary }"></div>
                <div class="flex-1" :style="{ backgroundColor: theme.preview.secondary }"></div>
                <div class="flex-1" :style="{ backgroundColor: theme.preview.accent }"></div>
              </div>

              <!-- Theme Info -->
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-medium text-[var(--theme-text-primary)]">{{ theme.displayName }}</h3>
                <span
                  v-if="currentTheme === theme.name"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--theme-accent-success)]/15 text-[var(--theme-accent-success)]"
                >
                  <Check :size="12" :stroke-width="2.25" /> Active
                </span>
              </div>
              <p class="text-sm text-[var(--theme-text-tertiary)] mt-1">{{ theme.description }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center pt-4 border-t border-[var(--theme-border-primary)]">
            <div class="text-sm text-[var(--theme-text-tertiary)]">
              {{ predefinedThemes.length }} themes available
            </div>
            <button
              @click="close"
              class="px-4 py-2 border border-[var(--theme-border-primary)] text-[var(--theme-text-secondary)] rounded-lg hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text-primary)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Palette, X, Check } from 'lucide-vue-next';
import { useThemes } from '../composables/useThemes';
import { useModalA11y } from '../composables/useModalA11y';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Theme management
const { state, predefinedThemes, setTheme } = useThemes();

// Computed properties
const currentTheme = computed(() => state.value.currentTheme);

// Methods
const selectTheme = (themeName: string) => {
  setTheme(themeName);
  close();
};

const close = () => {
  emit('close');
};

const modalRef = ref<HTMLElement | null>(null);
useModalA11y(() => props.isOpen, modalRef, close);
</script>