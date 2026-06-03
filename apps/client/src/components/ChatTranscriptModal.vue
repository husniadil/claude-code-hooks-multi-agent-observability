<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 mobile:p-0">
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
        aria-labelledby="chat-transcript-title"
        tabindex="-1"
        class="relative bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)] rounded-xl mobile:rounded-none flex flex-col overflow-hidden z-10 mobile:w-full mobile:h-full mobile:fixed mobile:inset-0 focus:outline-none"
        :style="{
          width: '85vw',
          height: '85vh',
          boxShadow: '0 24px 60px -12px rgba(20, 20, 19, 0.35)',
        }"
        :class="{ 'mobile:!w-full mobile:!h-full': true }"
        @click.stop
      >
        <!-- Header -->
        <div
          class="flex-shrink-0 bg-[var(--theme-bg-primary)] border-b border-[var(--theme-border-primary)] p-5 mobile:p-3"
        >
          <div class="flex items-center justify-between mb-4 mobile:mb-3">
            <h2
              id="chat-transcript-title"
              class="inline-flex items-center gap-2 font-display text-2xl mobile:text-lg leading-none text-[var(--theme-text-primary)] tracking-tight"
            >
              <MessageSquare
                :size="20"
                :stroke-width="1.75"
                class="text-[var(--theme-text-tertiary)]"
              />
              Transcript
              <span class="font-sans text-sm font-normal text-[var(--theme-text-quaternary)]"
                >{{ chat.length }} messages</span
              >
            </h2>
            <button
              class="p-2 rounded-lg text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] transition-colors"
              aria-label="Close"
              @click="close"
            >
              <X :size="20" :stroke-width="2" />
            </button>
          </div>

          <!-- Search and Filters -->
          <div class="space-y-3">
            <!-- Search Input -->
            <div class="flex gap-2">
              <div class="relative flex-1">
                <Search
                  :size="16"
                  :stroke-width="1.75"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-quaternary)] pointer-events-none"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search transcript…"
                  class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--theme-border-primary)] focus:outline-none focus:border-[var(--theme-primary)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-quaternary)]"
                  @keyup.enter="executeSearch"
                />
              </div>
              <button
                class="px-3.5 py-2 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-sm font-medium rounded-lg transition-colors"
                @click="executeSearch"
              >
                Search
              </button>
              <button
                class="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--theme-border-primary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text-primary)] text-sm font-medium rounded-lg transition-colors"
                title="Copy all messages as JSON"
                @click="copyAllMessages"
              >
                <component :is="copiedAll ? Check : Copy" :size="15" :stroke-width="1.75" />
                <span class="mobile:hidden">{{ copiedAll ? 'Copied' : 'Copy all' }}</span>
              </button>
            </div>

            <!-- Filters (grouped by level: Messages / Content / Tools) -->
            <div class="flex flex-col gap-2 max-h-40 mobile:max-h-44 overflow-y-auto">
              <div v-for="group in filterGroups" :key="group.label" class="flex flex-col gap-1">
                <span
                  class="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-quaternary)]"
                >
                  {{ group.label }}
                </span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="filter in group.filters"
                    :key="filter.type"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap border"
                    :class="
                      activeFilters.includes(filter.type)
                        ? 'bg-[var(--theme-text-primary)] text-[var(--theme-bg-primary)] border-[var(--theme-text-primary)]'
                        : 'text-[var(--theme-text-tertiary)] border-[var(--theme-border-primary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text-primary)]'
                    "
                    @click="toggleFilter(filter.type)"
                  >
                    <component :is="filter.icon" :size="13" :stroke-width="1.75" />
                    {{ filter.label }}
                  </button>
                </div>
              </div>

              <!-- Clear Filters -->
              <button
                v-if="searchQuery || activeSearchQuery || activeFilters.length > 0"
                class="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--theme-accent-error)] border border-[var(--theme-accent-error)]/40 hover:bg-[var(--theme-accent-error)]/10 whitespace-nowrap"
                @click="clearSearch"
              >
                <X :size="12" :stroke-width="2" /> Clear
              </button>
            </div>

            <!-- Results Count -->
            <div
              v-if="activeSearchQuery || activeFilters.length > 0"
              class="text-xs text-[var(--theme-text-tertiary)]"
            >
              Showing {{ filteredChat.length }} of {{ chat.length }} messages
              <span
                v-if="activeSearchQuery"
                class="ml-2 font-medium text-[var(--theme-text-secondary)] mobile:block mobile:ml-0 mobile:mt-1"
              >
                (searching for “{{ activeSearchQuery }}”)
              </span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div
          class="flex-1 p-5 mobile:p-3 overflow-hidden flex flex-col bg-[var(--theme-bg-secondary)]"
        >
          <ChatTranscript :chat="filteredChat" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Component } from 'vue';
import ChatTranscript from './ChatTranscript.vue';
import type { ChatItem } from '../types/chat';
import { useModalA11y } from '../composables/useModalA11y';
import {
  MessageSquare,
  Search,
  X,
  Copy,
  Check,
  User,
  Bot,
  Settings,
  Wrench,
  CircleCheck,
  BookOpen,
  PenLine,
  Pencil,
  FileSearch,
  Terminal,
  Globe,
  ListChecks,
  Plug,
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  chat: ChatItem[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const searchQuery = ref('');
const activeSearchQuery = ref('');
const activeFilters = ref<string[]>([]);
const copiedAll = ref(false);

// Sentinel filter type that collapses every mcp__* tool into one "MCP" chip.
const MCP_FILTER = '__mcp__';

const MESSAGE_FILTERS = [
  { type: 'user', label: 'User', icon: User },
  { type: 'assistant', label: 'Assistant', icon: Bot },
  { type: 'system', label: 'System', icon: Settings },
];

const CONTENT_FILTERS = [
  { type: 'tool_use', label: 'Tool Use', icon: Wrench },
  { type: 'tool_result', label: 'Tool Result', icon: CircleCheck },
];

const TOOL_ICONS: Record<string, Component> = {
  Read: BookOpen,
  Write: PenLine,
  Edit: Pencil,
  MultiEdit: Pencil,
  NotebookEdit: Pencil,
  Glob: FileSearch,
  Grep: Search,
  ToolSearch: Search,
  WebSearch: Search,
  WebFetch: Globe,
  Bash: Terminal,
  Task: Bot,
  TodoWrite: ListChecks,
};

// Filter chips derived from the actual transcript: a group is only shown when it
// has at least one matching message, so e.g. Glob never appears if it was unused.
const filterGroups = computed(() => {
  const present = new Set<string>();
  const toolNames = new Set<string>();
  let hasMcp = false;

  for (const item of props.chat) {
    if (item.type === 'user' || item.role === 'user') present.add('user');
    if (item.type === 'assistant' || item.role === 'assistant') present.add('assistant');
    if (item.type === 'system') present.add('system');

    const content = item.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_use') {
          present.add('tool_use');
          if (typeof block.name === 'string') {
            if (block.name.startsWith('mcp__')) hasMcp = true;
            else toolNames.add(block.name);
          }
        } else if (block.type === 'tool_result') {
          present.add('tool_result');
        }
      }
    }
  }

  const groups = [];

  const messages = MESSAGE_FILTERS.filter((f) => present.has(f.type));
  if (messages.length) groups.push({ label: 'Messages', filters: messages });

  const contentTypes = CONTENT_FILTERS.filter((f) => present.has(f.type));
  if (contentTypes.length) groups.push({ label: 'Content', filters: contentTypes });

  const tools = [...toolNames]
    .sort()
    .map((name) => ({ type: name, label: name, icon: TOOL_ICONS[name] || Wrench }));
  if (hasMcp) tools.push({ type: MCP_FILTER, label: 'MCP', icon: Plug });
  if (tools.length) groups.push({ label: 'Tools', filters: tools });

  return groups;
});

const toggleFilter = (type: string) => {
  const index = activeFilters.value.indexOf(type);
  if (index > -1) {
    activeFilters.value.splice(index, 1);
  } else {
    activeFilters.value.push(type);
  }
};

const executeSearch = () => {
  activeSearchQuery.value = searchQuery.value;
};

const clearSearch = () => {
  searchQuery.value = '';
  activeSearchQuery.value = '';
  activeFilters.value = [];
};

const close = () => {
  emit('close');
};

const modalRef = ref<HTMLElement | null>(null);
useModalA11y(() => props.isOpen, modalRef, close);

const copyAllMessages = async () => {
  try {
    // Copy all chat messages as formatted JSON
    const jsonPayload = JSON.stringify(props.chat, null, 2);
    await navigator.clipboard.writeText(jsonPayload);

    copiedAll.value = true;
    setTimeout(() => {
      copiedAll.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy all messages:', err);
  }
};

const matchesSearch = (item: ChatItem, query: string): boolean => {
  const lowerQuery = query.toLowerCase().trim();

  // Check direct content (for system messages and simple chat)
  if (typeof item.content === 'string') {
    // Remove ANSI codes before searching (the ESC control char is intentional here)
    // eslint-disable-next-line no-control-regex
    const cleanContent = item.content.replace(/\u001b\[[0-9;]*m/g, '').toLowerCase();
    if (cleanContent.includes(lowerQuery)) {
      return true;
    }
  }

  // Check role in simple format
  if (item.role && item.role.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Check message object (complex format)
  if (item.message) {
    // Check message role
    if (item.message.role && item.message.role.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check message content
    if (item.message.content) {
      if (
        typeof item.message.content === 'string' &&
        item.message.content.toLowerCase().includes(lowerQuery)
      ) {
        return true;
      }
      // Check array content
      if (Array.isArray(item.message.content)) {
        for (const content of item.message.content) {
          if (content.text && content.text.toLowerCase().includes(lowerQuery)) {
            return true;
          }
          if (content.name && content.name.toLowerCase().includes(lowerQuery)) {
            return true;
          }
          if (content.input && JSON.stringify(content.input).toLowerCase().includes(lowerQuery)) {
            return true;
          }
          if (
            content.content &&
            typeof content.content === 'string' &&
            content.content.toLowerCase().includes(lowerQuery)
          ) {
            return true;
          }
        }
      }
    }
  }

  // Check type
  if (item.type && item.type.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Check parentUuid, uuid, sessionId
  if (item.uuid && item.uuid.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (item.sessionId && item.sessionId.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Check toolUseResult
  if (item.toolUseResult) {
    if (JSON.stringify(item.toolUseResult).toLowerCase().includes(lowerQuery)) {
      return true;
    }
  }

  return false;
};

const matchesFilters = (item: ChatItem): boolean => {
  if (activeFilters.value.length === 0) return true;

  // Check message type
  if (item.type && activeFilters.value.includes(item.type)) {
    return true;
  }

  // Check role (simple format)
  if (item.role && activeFilters.value.includes(item.role)) {
    return true;
  }

  // Check for system messages with hook types
  if (item.type === 'system' && item.content) {
    // Extract hook type from system content (e.g., "PreToolUse:Read")
    const hookMatch = item.content.match(/([A-Za-z]+):/)?.[1];
    if (hookMatch && activeFilters.value.includes(hookMatch)) {
      return true;
    }
    // Also check if content contains "Running"
    if (item.content.includes('Running') && activeFilters.value.includes('Running')) {
      return true;
    }
    // Check for specific tool names in system messages
    const toolNames = ['Read', 'Write', 'Edit', 'Glob'];
    for (const tool of toolNames) {
      if (item.content.includes(tool) && activeFilters.value.includes(tool)) {
        return true;
      }
    }
  }

  // Check for command messages
  if (item.message?.content && typeof item.message.content === 'string') {
    if (item.message.content.includes('<command-') && activeFilters.value.includes('command')) {
      return true;
    }
  }

  // Check for meta messages
  if (item.isMeta && activeFilters.value.includes('meta')) {
    return true;
  }

  // Check for tool use in content
  if (item.message?.content && Array.isArray(item.message.content)) {
    for (const content of item.message.content) {
      if (content.type === 'tool_use') {
        if (activeFilters.value.includes('tool_use')) {
          return true;
        }
        // Check for specific tool names
        if (content.name && activeFilters.value.includes(content.name)) {
          return true;
        }
        // Collapsed MCP chip matches any mcp__* tool
        if (
          typeof content.name === 'string' &&
          content.name.startsWith('mcp__') &&
          activeFilters.value.includes(MCP_FILTER)
        ) {
          return true;
        }
      }
      if (content.type === 'tool_result' && activeFilters.value.includes('tool_result')) {
        return true;
      }
    }
  }

  return false;
};

const filteredChat = computed(() => {
  if (!activeSearchQuery.value && activeFilters.value.length === 0) {
    return props.chat;
  }

  return props.chat.filter((item) => {
    const matchesQueryCondition =
      !activeSearchQuery.value || matchesSearch(item, activeSearchQuery.value);
    const matchesFilterCondition = matchesFilters(item);
    return matchesQueryCondition && matchesFilterCondition;
  });
});

// Reset search when modal closes
watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      clearSearch();
    }
  },
);
</script>
