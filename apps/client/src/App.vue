<template>
  <div class="h-screen flex flex-col bg-[var(--theme-bg-secondary)]">
    <!-- Top navigation — cream canvas, hairline rule, color-block first -->
    <header
      class="short:hidden bg-[var(--theme-bg-primary)] border-b border-[var(--theme-border-primary)]"
    >
      <div class="px-5 py-3 mobile:py-2 mobile:px-3 flex items-center justify-between gap-3">
        <!-- Brand -->
        <div class="flex items-center gap-2.5 min-w-0">
          <SpikeMark class="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
          <h1
            class="font-display text-2xl mobile:text-lg leading-none text-[var(--theme-text-primary)] tracking-tight truncate"
          >
            Observability
          </h1>
        </div>

        <!-- Right cluster -->
        <div class="flex items-center gap-2 mobile:gap-1.5">
          <!-- Connection status -->
          <div
            class="flex items-center gap-1.5 px-2.5 py-1 mobile:px-2 rounded-full border border-[var(--theme-border-primary)]"
          >
            <span class="relative flex h-2 w-2">
              <span
                v-if="isConnected"
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                :style="{ backgroundColor: 'var(--theme-accent-success)' }"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2"
                :style="{
                  backgroundColor: isConnected
                    ? 'var(--theme-accent-success)'
                    : 'var(--theme-accent-error)',
                }"
              ></span>
            </span>
            <span class="text-xs font-medium text-[var(--theme-text-tertiary)] mobile:hidden">
              {{ isConnected ? 'Live' : 'Offline' }}
            </span>
          </div>

          <!-- Event count -->
          <span
            class="text-xs font-medium font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-tertiary)] px-2.5 py-1 rounded-full tabular-nums"
          >
            {{ events.length }}
          </span>

          <div class="w-px h-5 bg-[var(--theme-border-primary)] mx-0.5 mobile:hidden"></div>

          <!-- Icon actions -->
          <button class="nav-icon-btn" title="Clear events" @click="handleClearClick">
            <Trash2 :size="17" :stroke-width="1.75" />
          </button>
          <button
            class="nav-icon-btn"
            :class="{ 'nav-icon-btn--active': showFilters }"
            :title="showFilters ? 'Hide filters' : 'Show filters'"
            @click="showFilters = !showFilters"
          >
            <SlidersHorizontal :size="17" :stroke-width="1.75" />
          </button>
          <button class="nav-icon-btn" title="Open theme manager" @click="handleThemeManagerClick">
            <Palette :size="17" :stroke-width="1.75" />
          </button>
        </div>
      </div>
    </header>

    <!-- Filters -->
    <FilterPanel
      v-if="showFilters"
      class="short:hidden"
      :filters="filters"
      @update:filters="filters = $event"
    />

    <!-- Live Pulse Chart -->
    <LivePulseChart
      :events="events"
      :filters="filters"
      @update-unique-apps="uniqueAppNames = $event"
      @update-all-apps="allAppNames = $event"
      @update-time-range="currentTimeRange = $event"
    />

    <!-- Agent Swim Lane Container (below pulse chart, full width, hidden when empty) -->
    <div
      v-if="selectedAgentLanes.length > 0"
      class="w-full bg-[var(--theme-bg-secondary)] px-3 py-4 mobile:px-2 mobile:py-2 overflow-hidden"
    >
      <AgentSwimLaneContainer
        :selected-agents="selectedAgentLanes"
        :events="events"
        :time-range="currentTimeRange"
        @update:selected-agents="selectedAgentLanes = $event"
      />
    </div>

    <!-- Timeline -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <EventTimeline
        v-model:stick-to-bottom="stickToBottom"
        :events="events"
        :filters="filters"
        :unique-app-names="uniqueAppNames"
        :all-app-names="allAppNames"
        @select-agent="toggleAgentLane"
      />
    </div>

    <!-- Stick to bottom button -->
    <StickScrollButton
      class="short:hidden"
      :stick-to-bottom="stickToBottom"
      @toggle="stickToBottom = !stickToBottom"
    />

    <!-- Error message -->
    <div
      v-if="error"
      class="fixed bottom-4 left-4 mobile:bottom-3 mobile:left-3 mobile:right-3 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm mobile:text-xs bg-[var(--theme-bg-primary)] border border-[var(--theme-accent-error)]/40 text-[var(--theme-accent-error)]"
      style="box-shadow: 0 6px 20px -6px rgba(20, 20, 19, 0.18)"
    >
      <AlertTriangle :size="15" :stroke-width="1.75" class="shrink-0" />
      {{ error }}
    </div>

    <!-- Theme Manager -->
    <ThemeManager :is-open="showThemeManager" @close="showThemeManager = false" />

    <!-- Toast Notifications -->
    <ToastNotification
      v-for="(toast, index) in toasts"
      :key="toast.id"
      :index="index"
      :agent-name="toast.agentName"
      :agent-color="toast.agentColor"
      @dismiss="dismissToast(toast.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TimeRange } from './types';
import { useWebSocket } from './composables/useWebSocket';
import { useThemes } from './composables/useThemes';
import { useEventColors } from './composables/useEventColors';
import EventTimeline from './components/EventTimeline.vue';
import FilterPanel from './components/FilterPanel.vue';
import StickScrollButton from './components/StickScrollButton.vue';
import LivePulseChart from './components/LivePulseChart.vue';
import ThemeManager from './components/ThemeManager.vue';
import ToastNotification from './components/ToastNotification.vue';
import AgentSwimLaneContainer from './components/AgentSwimLaneContainer.vue';
import SpikeMark from './components/SpikeMark.vue';
import { Trash2, SlidersHorizontal, Palette, AlertTriangle } from 'lucide-vue-next';
import { WS_URL } from './config';

// WebSocket connection
const { events, isConnected, error, clearEvents } = useWebSocket(WS_URL);

// Theme management (sets up theme system)
useThemes();

// Event colors
const { getHexColorForApp } = useEventColors();

// Filters
const filters = ref({
  sourceApp: '',
  sessionId: '',
  eventType: '',
});

// UI state
const stickToBottom = ref(true);
const showThemeManager = ref(false);
const showFilters = ref(false);
const uniqueAppNames = ref<string[]>([]); // Apps active in current time window
const allAppNames = ref<string[]>([]); // All apps ever seen in session
const selectedAgentLanes = ref<string[]>([]);
const currentTimeRange = ref<TimeRange>('1m'); // Current time range from LivePulseChart

// Toast notifications
interface Toast {
  id: number;
  agentName: string;
  agentColor: string;
}
const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;
const seenAgents = new Set<string>();

// Watch for new agents and show toast
watch(
  uniqueAppNames,
  (newAppNames) => {
    // Find agents that are new (not in seenAgents set)
    newAppNames.forEach((appName) => {
      if (!seenAgents.has(appName)) {
        seenAgents.add(appName);
        // Show toast for new agent
        const toast: Toast = {
          id: toastIdCounter++,
          agentName: appName,
          agentColor: getHexColorForApp(appName),
        };
        toasts.value.push(toast);
      }
    });
  },
  { deep: true },
);

const dismissToast = (id: number) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

// Handle agent tag clicks for swim lanes
const toggleAgentLane = (agentName: string) => {
  const index = selectedAgentLanes.value.indexOf(agentName);
  if (index >= 0) {
    // Remove from comparison
    selectedAgentLanes.value.splice(index, 1);
  } else {
    // Add to comparison
    selectedAgentLanes.value.push(agentName);
  }
};

// Handle clear button click
const handleClearClick = () => {
  clearEvents();
  selectedAgentLanes.value = [];
};

// Debug handler for theme manager
const handleThemeManagerClick = () => {
  showThemeManager.value = true;
};
</script>

<style scoped>
.nav-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: var(--theme-text-secondary);
  border: 1px solid transparent;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.nav-icon-btn:hover {
  background-color: var(--theme-hover-bg);
  color: var(--theme-text-primary);
  border-color: var(--theme-border-primary);
}

.nav-icon-btn--active {
  color: var(--theme-primary);
  border-color: var(--theme-border-primary);
  background-color: var(--theme-bg-tertiary);
}

@media (max-width: 699px) {
  .nav-icon-btn {
    width: 38px;
    height: 38px;
  }
}
</style>
