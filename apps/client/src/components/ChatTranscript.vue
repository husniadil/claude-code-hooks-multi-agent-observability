<template>
  <div class="h-full overflow-y-auto space-y-2.5 pr-1">
    <div v-for="(item, index) in chatItems" :key="index">
      <!-- User Message -->
      <div
v-if="item.type === 'user' && item.message"
           class="p-3 rounded-lg bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)]">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1 min-w-0">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-[var(--theme-accent-info)]/15 text-[var(--theme-accent-info)]">
              User
            </span>
            <div class="flex-1 min-w-0">
              <!-- Handle string content (rendered as markdown) -->
              <MarkdownText
                v-if="typeof item.message.content === 'string'"
                :text="item.message.content.includes('<command-') ? cleanCommandContent(item.message.content) : item.message.content"
              />
              <!-- Handle array content -->
              <div v-else-if="Array.isArray(item.message.content)" class="space-y-2">
                <div v-for="(content, cIndex) in item.message.content" :key="cIndex">
                  <!-- Text content (rendered as markdown) -->
                  <MarkdownText v-if="content.type === 'text'" :text="content.text || ''" />
                  <!-- Tool result -->
                  <div
v-else-if="content.type === 'tool_result'"
                       class="bg-[var(--theme-surface-dark)] p-2.5 rounded-lg">
                    <span class="text-xs font-mono text-[var(--theme-on-dark-soft)]">Tool Result</span>
                    <pre class="text-xs font-mono text-[var(--theme-on-dark)] mt-1 whitespace-pre-wrap break-words">{{ content.content }}</pre>
                  </div>
                </div>
              </div>
              <!-- Metadata -->
              <div v-if="item.timestamp" class="mt-2 text-xs text-[var(--theme-text-quaternary)]">
                {{ formatTimestamp(item.timestamp) }}
              </div>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <!-- Show Details Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-center min-w-[6rem] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors"
              @click="toggleDetails(index)"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </button>
            <!-- Copy Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors flex items-center"
              :title="'Copy message'"
              @click="copyMessage(index, item.type || item.role)"
            >
              {{ getCopyButtonText(index) }}
            </button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-[var(--theme-surface-dark)] rounded-lg">
          <pre class="text-xs font-mono text-[var(--theme-on-dark)] overflow-x-auto whitespace-pre-wrap break-words">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </div>

      <!-- Assistant Message -->
      <div
v-else-if="item.type === 'assistant' && item.message"
           class="p-3 rounded-lg bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)]">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1 min-w-0">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]">
              Assistant
            </span>
            <div class="flex-1 min-w-0">
              <!-- Handle content array -->
              <div v-if="Array.isArray(item.message.content)" class="space-y-2">
                <div v-for="(content, cIndex) in item.message.content" :key="cIndex">
                  <!-- Text content (rendered as markdown) -->
                  <MarkdownText v-if="content.type === 'text'" :text="content.text || ''" />
                  <!-- Thinking content -->
                  <div
                    v-else-if="content.type === 'thinking'"
                    class="border-l-2 border-[var(--theme-border-secondary)] pl-3 py-0.5"
                  >
                    <div class="flex items-center gap-1.5 mb-1">
                      <Brain :size="13" :stroke-width="1.75" class="text-[var(--theme-text-quaternary)]" />
                      <span class="text-xs font-medium uppercase tracking-wide text-[var(--theme-text-quaternary)]">Thinking</span>
                    </div>
                    <p class="text-sm italic text-[var(--theme-text-tertiary)] whitespace-pre-wrap leading-relaxed break-words">
                      {{ content.thinking }}
                    </p>
                  </div>
                  <!-- Tool use (incl. server-side tools) -->
                  <div
v-else-if="content.type === 'tool_use' || content.type === 'server_tool_use'"
                       class="bg-[var(--theme-surface-dark)] p-3 rounded-lg">
                    <div class="flex items-center gap-2 mb-2">
                      <Wrench :size="14" :stroke-width="1.75" class="text-[var(--theme-accent-amber)]" />
                      <span class="text-sm font-medium font-mono text-[var(--theme-accent-amber)]">{{ content.name }}</span>
                    </div>
                    <pre class="text-xs font-mono text-[var(--theme-on-dark)] overflow-x-auto whitespace-pre-wrap break-words">{{ JSON.stringify(content.input, null, 2) }}</pre>
                  </div>
                  <!-- Tool result (incl. advisor server result) -->
                  <div
v-else-if="content.type === 'tool_result' || content.type === 'advisor_tool_result'"
                       class="bg-[var(--theme-surface-dark)] p-2.5 rounded-lg">
                    <span class="text-xs font-mono text-[var(--theme-on-dark-soft)]">Tool Result</span>
                    <pre class="text-xs font-mono text-[var(--theme-on-dark)] mt-1 whitespace-pre-wrap break-words">{{ blockText(content) }}</pre>
                  </div>
                </div>
              </div>
              <!-- Usage info -->
              <div v-if="item.message.usage" class="mt-2 text-xs text-[var(--theme-text-quaternary)]">
                Tokens: {{ item.message.usage.input_tokens }} in / {{ item.message.usage.output_tokens }} out
              </div>
              <!-- Timestamp -->
              <div v-if="item.timestamp" class="mt-1 text-xs text-[var(--theme-text-quaternary)]">
                {{ formatTimestamp(item.timestamp) }}
              </div>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <!-- Show Details Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-center min-w-[6rem] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors"
              @click="toggleDetails(index)"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </button>
            <!-- Copy Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors flex items-center"
              :title="'Copy message'"
              @click="copyMessage(index, item.type || item.role)"
            >
              {{ getCopyButtonText(index) }}
            </button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-[var(--theme-surface-dark)] rounded-lg">
          <pre class="text-xs font-mono text-[var(--theme-on-dark)] overflow-x-auto whitespace-pre-wrap break-words">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </div>

      <!-- System Message -->
      <div
v-else-if="item.type === 'system'"
           class="p-3 rounded-lg bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)]">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1 min-w-0">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-[var(--theme-accent-warning)]/15 text-[var(--theme-accent-warning)]">
              System
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-[var(--theme-text-secondary)] whitespace-pre-wrap leading-relaxed font-mono">
                {{ cleanSystemContent(item.content || '') }}
              </p>
              <!-- Tool use ID if present -->
              <div v-if="item.toolUseID" class="mt-1 text-xs text-[var(--theme-text-quaternary)] font-mono">
                Tool ID: {{ item.toolUseID }}
              </div>
              <!-- Timestamp -->
              <div v-if="item.timestamp" class="mt-1 text-xs text-[var(--theme-text-quaternary)]">
                {{ formatTimestamp(item.timestamp) }}
              </div>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <!-- Show Details Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-center min-w-[6rem] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors"
              @click="toggleDetails(index)"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </button>
            <!-- Copy Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors flex items-center"
              :title="'Copy message'"
              @click="copyMessage(index, item.type || item.role)"
            >
              {{ getCopyButtonText(index) }}
            </button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-[var(--theme-surface-dark)] rounded-lg">
          <pre class="text-xs font-mono text-[var(--theme-on-dark)] overflow-x-auto whitespace-pre-wrap break-words">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </div>

      <!-- Fallback for simple chat format -->
      <div
v-else-if="item.role"
           class="p-3 rounded-lg bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)]">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1 min-w-0">
            <span
class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                  :class="item.role === 'user' ? 'bg-[var(--theme-accent-info)]/15 text-[var(--theme-accent-info)]' : 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]'">
              {{ item.role === 'user' ? 'User' : 'Assistant' }}
            </span>
            <div class="flex-1 min-w-0">
              <MarkdownText :text="item.content || ''" />
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <!-- Show Details Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-center min-w-[6rem] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors"
              @click="toggleDetails(index)"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </button>
            <!-- Copy Button -->
            <button
              class="px-2 py-1 text-xs font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-hover-bg)] rounded transition-colors flex items-center"
              :title="'Copy message'"
              @click="copyMessage(index, item.type || item.role)"
            >
              {{ getCopyButtonText(index) }}
            </button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-[var(--theme-surface-dark)] rounded-lg">
          <pre class="text-xs font-mono text-[var(--theme-on-dark)] overflow-x-auto whitespace-pre-wrap break-words">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Wrench, Brain } from 'lucide-vue-next';
import MarkdownText from './MarkdownText.vue';
import type { ChatItem, ChatContentBlock } from '../types/chat';

const props = defineProps<{
  chat: ChatItem[];
}>();

// Track which items have details expanded
const expandedDetails = ref<Set<number>>(new Set());

const toggleDetails = (index: number) => {
  if (expandedDetails.value.has(index)) {
    expandedDetails.value.delete(index);
  } else {
    expandedDetails.value.add(index);
  }
  // Force reactivity
  expandedDetails.value = new Set(expandedDetails.value);
};

const isDetailsExpanded = (index: number) => {
  return expandedDetails.value.has(index);
};

const chatItems = computed(() => {
  // Render in wall-clock order. The transcript active-path order jumps at the
  // /compact boundary (the summary node is written with a later timestamp than
  // the command that triggered it), so sort by timestamp when every item has
  // one; otherwise (simple role/content format) leave the order untouched.
  if (props.chat.length > 0 && props.chat.every((i) => i.timestamp)) {
    return [...props.chat].sort((a, b) => Date.parse(a.timestamp ?? '') - Date.parse(b.timestamp ?? ''));
  }
  return props.chat;
});

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

// Tool-result content is sometimes a string, sometimes an object ({ text } for
// advisor results). Surface the human-readable text, JSON-dumping anything else.
const blockText = (block: ChatContentBlock): string => {
  const c = block.content;
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object') {
    const t = (c as { text?: unknown }).text;
    if (typeof t === 'string') return t;
  }
  return JSON.stringify(c, null, 2);
};

// const cleanContent = (content: string) => {
//   // Remove command message tags
//   return content
//     .replace(/<command-message>.*?<\/command-message>/gs, '')
//     .replace(/<command-name>.*?<\/command-name>/gs, '')
//     .trim();
// };

const cleanSystemContent = (content: string) => {
  // Remove ANSI escape codes (the ESC control char is intentional here)
  // eslint-disable-next-line no-control-regex
  return content.replace(/\u001b\[[0-9;]*m/g, '');
};

const cleanCommandContent = (content: string) => {
  // Remove command tags and clean content
  return content
    .replace(/<command-message>.*?<\/command-message>/gs, '')
    .replace(/<command-name>(.*?)<\/command-name>/gs, '$1')
    .trim();
};

// Track copy button states
const copyButtonStates = ref<Map<number, string>>(new Map());

const getCopyButtonText = (index: number) => {
  return copyButtonStates.value.get(index) || 'Copy';
};

const copyMessage = async (index: number, _type: string) => {
  const item = chatItems.value[index];

  try {
    // Copy the entire JSON payload
    const jsonPayload = JSON.stringify(item, null, 2);
    await navigator.clipboard.writeText(jsonPayload);
    
    copyButtonStates.value.set(index, 'Copied');
    setTimeout(() => {
      copyButtonStates.value.delete(index);
      copyButtonStates.value = new Map(copyButtonStates.value);
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    copyButtonStates.value.set(index, 'Failed');
    setTimeout(() => {
      copyButtonStates.value.delete(index);
      copyButtonStates.value = new Map(copyButtonStates.value);
    }, 2000);
  }
  // Force reactivity
  copyButtonStates.value = new Map(copyButtonStates.value);
};
</script>