<template>
  <div class="bg-[var(--theme-bg-secondary)] border-b border-[var(--theme-border-primary)] px-5 mobile:px-3 py-3 mobile:py-2.5">
    <div class="flex flex-wrap gap-3 items-end mobile:flex-col mobile:items-stretch">
      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-xs font-medium uppercase tracking-wider text-[var(--theme-text-quaternary)] mb-1">
          Source App
        </label>
        <select
          v-model="localFilters.sourceApp"
          @change="updateFilters"
          class="filter-select"
        >
          <option value="">All sources</option>
          <option v-for="app in filterOptions.source_apps" :key="app" :value="app">
            {{ app }}
          </option>
        </select>
      </div>

      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-xs font-medium uppercase tracking-wider text-[var(--theme-text-quaternary)] mb-1">
          Session ID
        </label>
        <select
          v-model="localFilters.sessionId"
          @change="updateFilters"
          class="filter-select"
        >
          <option value="">All sessions</option>
          <option v-for="session in filterOptions.session_ids" :key="session" :value="session">
            {{ session.slice(0, 8) }}…
          </option>
        </select>
      </div>

      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-xs font-medium uppercase tracking-wider text-[var(--theme-text-quaternary)] mb-1">
          Event Type
        </label>
        <select
          v-model="localFilters.eventType"
          @change="updateFilters"
          class="filter-select"
        >
          <option value="">All types</option>
          <option v-for="type in filterOptions.hook_event_types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="inline-flex items-center gap-1.5 px-3 py-2 mobile:w-full mobile:justify-center text-sm font-medium text-[var(--theme-text-secondary)] border border-[var(--theme-border-primary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text-primary)] rounded-lg transition-colors"
      >
        <X :size="15" :stroke-width="1.75" /> Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { FilterOptions } from '../types';
import { X } from 'lucide-vue-next';
import { API_BASE_URL } from '../config';

const props = defineProps<{
  filters: {
    sourceApp: string;
    sessionId: string;
    eventType: string;
  };
}>();

const emit = defineEmits<{
  'update:filters': [filters: typeof props.filters];
}>();

const filterOptions = ref<FilterOptions>({
  source_apps: [],
  session_ids: [],
  hook_event_types: []
});

const localFilters = ref({ ...props.filters });

const hasActiveFilters = computed(() => {
  return localFilters.value.sourceApp || localFilters.value.sessionId || localFilters.value.eventType;
});

const updateFilters = () => {
  emit('update:filters', { ...localFilters.value });
};

const clearFilters = () => {
  localFilters.value = {
    sourceApp: '',
    sessionId: '',
    eventType: ''
  };
  updateFilters();
};

const fetchFilterOptions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/filter-options`);
    if (response.ok) {
      filterOptions.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
  }
};

onMounted(() => {
  fetchFilterOptions();
  // Refresh filter options periodically
  setInterval(fetchFilterOptions, 10000);
});
</script>
<style scoped>
.filter-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--theme-border-primary);
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  transition: border-color 0.15s ease;
}
.filter-select:focus {
  outline: none;
  border-color: var(--theme-primary);
}
</style>
