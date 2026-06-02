<template>
  <div class="flex-1 mobile:h-[50vh] overflow-hidden flex flex-col">
    <!-- Fixed Header -->
    <div
      class="px-5 mobile:px-3 py-3 mobile:py-2 bg-[var(--theme-bg-primary)] border-b border-[var(--theme-border-primary)] relative z-10"
    >
      <div class="flex items-center justify-between gap-3">
        <h2
          class="font-display text-xl mobile:text-lg leading-none text-[var(--theme-text-primary)] tracking-tight"
        >
          Event Stream
        </h2>
        <span class="text-xs font-mono text-[var(--theme-text-quaternary)] tabular-nums">
          {{ filteredEvents.length }} shown
        </span>
      </div>

      <!-- Agent/App Tags Row -->
      <div v-if="displayedAgentIds.length > 0" class="mt-2.5 flex flex-wrap gap-1.5 justify-start">
        <button
          v-for="agentId in displayedAgentIds"
          :key="agentId"
          :class="[
            'group/tag inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border transition-colors duration-150 cursor-pointer',
            isAgentActive(agentId)
              ? 'text-[var(--theme-text-secondary)] border-[var(--theme-border-secondary)] hover:border-[var(--theme-primary)]'
              : 'text-[var(--theme-text-quaternary)] border-[var(--theme-border-primary)] opacity-70 hover:opacity-100',
          ]"
          :title="`${isAgentActive(agentId) ? 'Active' : 'Sleeping (no recent events)'} — click to add ${agentId} to comparison lanes`"
          @click="emit('selectAgent', agentId)"
        >
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :style="{ backgroundColor: getHexColorForApp(getAppNameFromAgentId(agentId)) }"
            :class="{ 'opacity-40': !isAgentActive(agentId) }"
          ></span>
          <span>{{ agentId }}</span>
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mt-2.5 w-full">
        <div class="relative">
          <Search
            :size="15"
            :stroke-width="1.75"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-quaternary)] pointer-events-none"
          />
          <input
            type="text"
            :value="searchPattern"
            placeholder="Search events — regex enabled, e.g. tool.*error or ^GET"
            :class="[
              'w-full pl-9 pr-9 py-2 rounded-lg text-sm mobile:text-xs font-mono transition-colors duration-150',
              'bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-quaternary)]',
              'border focus:outline-none',
              searchError
                ? 'border-[var(--theme-accent-error)] focus:border-[var(--theme-accent-error)]'
                : 'border-[var(--theme-border-primary)] focus:border-[var(--theme-primary)]',
            ]"
            aria-label="Search events with regex pattern"
            @input="updateSearchPattern(($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="searchPattern"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-primary)] transition-colors"
            title="Clear search"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <X :size="15" :stroke-width="2" />
          </button>
        </div>
        <div
          v-if="searchError"
          class="mt-1.5 px-2.5 py-1.5 bg-[var(--theme-accent-error)]/10 border border-[var(--theme-accent-error)]/40 rounded-lg text-xs text-[var(--theme-accent-error)] font-medium flex items-center gap-1.5"
          role="alert"
        >
          <AlertTriangle :size="13" :stroke-width="2" class="shrink-0" /> {{ searchError }}
        </div>
      </div>
    </div>

    <!-- Scrollable Event List -->
    <div
      ref="scrollContainer"
      class="flex-1 overflow-y-auto px-3 py-3 mobile:px-2 mobile:py-1.5 relative"
      @scroll="handleScroll"
    >
      <TransitionGroup name="event" tag="div" class="space-y-2 mobile:space-y-1.5">
        <EventRow
          v-for="event in filteredEvents"
          :key="`${event.id}-${event.timestamp}`"
          :event="event"
          :app-hex-color="getHexColorForApp(event.source_app)"
        />
      </TransitionGroup>

      <div
        v-if="filteredEvents.length === 0"
        class="text-center py-12 mobile:py-8 text-[var(--theme-text-tertiary)]"
      >
        <Inbox
          :size="36"
          :stroke-width="1.25"
          class="mx-auto mb-3 text-[var(--theme-text-quaternary)]"
        />
        <p class="font-display text-xl text-[var(--theme-text-primary)] mb-1">No events yet</p>
        <p class="text-sm text-[var(--theme-text-tertiary)]">
          Events appear here as they stream in.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { HookEvent } from '../types';
import EventRow from './EventRow.vue';
import { Search, X, AlertTriangle, Inbox } from 'lucide-vue-next';
import { useEventColors } from '../composables/useEventColors';
import { useEventSearch } from '../composables/useEventSearch';

const props = defineProps<{
  events: HookEvent[];
  filters: {
    sourceApp: string;
    sessionId: string;
    eventType: string;
  };
  stickToBottom: boolean;
  uniqueAppNames?: string[]; // Agent IDs (app:session) active in current time window
  allAppNames?: string[]; // All agent IDs (app:session) ever seen in session
}>();

const emit = defineEmits<{
  'update:stickToBottom': [value: boolean];
  selectAgent: [agentName: string];
}>();

const scrollContainer = ref<HTMLElement>();
const { getHexColorForApp } = useEventColors();
const { searchPattern, searchError, searchEvents, updateSearchPattern, clearSearch } =
  useEventSearch();

// Use all agent IDs, preferring allAppNames if available (all ever seen), fallback to uniqueAppNames (active in time window)
const displayedAgentIds = computed(() => {
  return props.allAppNames?.length ? props.allAppNames : props.uniqueAppNames || [];
});

// Extract app name from agent ID (format: "app:session")
const getAppNameFromAgentId = (agentId: string): string => {
  return agentId.split(':')[0];
};

// Check if an agent is currently active (has events in the current time window)
const isAgentActive = (agentId: string): boolean => {
  return (props.uniqueAppNames || []).includes(agentId);
};

const filteredEvents = computed(() => {
  let filtered = props.events.filter((event) => {
    if (props.filters.sourceApp && event.source_app !== props.filters.sourceApp) {
      return false;
    }
    if (props.filters.sessionId && event.session_id !== props.filters.sessionId) {
      return false;
    }
    if (props.filters.eventType && event.hook_event_type !== props.filters.eventType) {
      return false;
    }
    return true;
  });

  // Apply regex search filter
  if (searchPattern.value) {
    filtered = searchEvents(filtered, searchPattern.value);
  }

  return filtered;
});

const scrollToBottom = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

const handleScroll = () => {
  if (!scrollContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

  if (isAtBottom !== props.stickToBottom) {
    emit('update:stickToBottom', isAtBottom);
  }
};

watch(
  () => props.events.length,
  async () => {
    if (props.stickToBottom) {
      await nextTick();
      scrollToBottom();
    }
  },
);

watch(
  () => props.stickToBottom,
  (shouldStick) => {
    if (shouldStick) {
      scrollToBottom();
    }
  },
);
</script>

<style scoped>
.event-enter-active {
  transition: all 0.3s ease;
}

.event-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.event-leave-active {
  transition: all 0.3s ease;
}

.event-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
