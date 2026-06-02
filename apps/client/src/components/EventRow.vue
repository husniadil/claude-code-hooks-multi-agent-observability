<template>
  <div>
    <!-- HITL Question Section (NEW) -->
    <div
      v-if="
        event.humanInTheLoop &&
        (event.humanInTheLoopStatus?.status === 'pending' || hasSubmittedResponse)
      "
      class="mb-3 p-4 rounded-xl border"
      :class="
        hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded'
          ? 'border-[var(--theme-accent-success)]/40 bg-[var(--theme-accent-success)]/[0.06]'
          : 'border-[var(--theme-accent-warning)]/45 bg-[var(--theme-accent-warning)]/[0.07] animate-pulse-slow'
      "
      @click.stop
    >
      <!-- Question Header -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-2 gap-2">
          <div class="flex items-center gap-2 min-w-0 flex-wrap">
            <component
              :is="hitlTypeIcon"
              :size="16"
              :stroke-width="1.85"
              class="shrink-0"
              :class="
                hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded'
                  ? 'text-[var(--theme-accent-success)]'
                  : 'text-[var(--theme-accent-warning)]'
              "
            />
            <h3
              class="text-base font-semibold"
              :class="
                hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded'
                  ? 'text-[var(--theme-accent-success)]'
                  : 'text-[var(--theme-accent-warning)]'
              "
            >
              {{ hitlTypeLabel }}
            </h3>
            <span
              v-if="permissionType"
              class="text-xs font-mono font-medium px-2 py-0.5 rounded-full border bg-[var(--theme-accent-info)]/10 border-[var(--theme-accent-info)]/40 text-[var(--theme-accent-info)]"
            >
              {{ permissionType }}
            </span>
          </div>
          <span
            v-if="!hasSubmittedResponse && event.humanInTheLoopStatus?.status !== 'responded'"
            class="inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-accent-warning)] shrink-0"
          >
            <Clock :size="12" :stroke-width="2" /> Waiting…
          </span>
        </div>
        <div class="flex items-center gap-2.5 ml-7 flex-wrap">
          <span
            class="inline-flex items-center gap-1.5 text-xs font-medium font-mono text-[var(--theme-text-primary)]"
          >
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :style="{ backgroundColor: appHexColor }"
            ></span>
            {{ event.source_app }}
          </span>
          <span class="text-xs font-mono text-[var(--theme-text-quaternary)]">{{
            sessionIdShort
          }}</span>
          <span class="text-xs font-mono text-[var(--theme-text-quaternary)] tabular-nums">{{
            formatTime(event.timestamp)
          }}</span>
        </div>
      </div>

      <!-- Question Text -->
      <div
        class="mb-4 p-3 bg-[var(--theme-bg-primary)] rounded-lg border border-[var(--theme-border-primary)]"
      >
        <p class="text-sm text-[var(--theme-text-primary)] leading-relaxed">
          {{ event.humanInTheLoop.question }}
        </p>
      </div>

      <!-- Inline Response Display (Optimistic UI) -->
      <div
        v-if="
          localResponse ||
          (event.humanInTheLoopStatus?.status === 'responded' &&
            event.humanInTheLoopStatus.response)
        "
        class="mb-4 p-3 bg-[var(--theme-bg-primary)] rounded-lg border border-[var(--theme-accent-success)]/40"
      >
        <div class="flex items-center gap-1.5 mb-2">
          <Check :size="15" :stroke-width="2" class="text-[var(--theme-accent-success)]" />
          <strong class="text-sm text-[var(--theme-text-primary)]">Your response</strong>
        </div>
        <div
          v-if="localResponse?.response || event.humanInTheLoopStatus?.response?.response"
          class="text-sm text-[var(--theme-text-secondary)] ml-6"
        >
          {{ localResponse?.response || event.humanInTheLoopStatus?.response?.response }}
        </div>
        <div
          v-if="
            localResponse?.permission !== undefined ||
            event.humanInTheLoopStatus?.response?.permission !== undefined
          "
          class="text-sm font-medium ml-6"
          :class="
            (localResponse?.permission ?? event.humanInTheLoopStatus?.response?.permission)
              ? 'text-[var(--theme-accent-success)]'
              : 'text-[var(--theme-accent-error)]'
          "
        >
          {{
            (localResponse?.permission ?? event.humanInTheLoopStatus?.response?.permission)
              ? 'Approved'
              : 'Denied'
          }}
        </div>
        <div
          v-if="localResponse?.choice || event.humanInTheLoopStatus?.response?.choice"
          class="text-sm text-[var(--theme-text-secondary)] ml-6"
        >
          {{ localResponse?.choice || event.humanInTheLoopStatus?.response?.choice }}
        </div>
      </div>

      <!-- Response UI -->
      <div v-if="event.humanInTheLoop.type === 'question'">
        <!-- Text Input for Questions -->
        <textarea
          v-model="responseText"
          class="w-full p-3 text-sm rounded-lg border border-[var(--theme-border-primary)] bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-quaternary)] focus:outline-none focus:border-[var(--theme-primary)] resize-none"
          rows="3"
          placeholder="Type your response…"
          @click.stop
        ></textarea>
        <div class="flex justify-end mt-2">
          <button
            :disabled="!responseText.trim() || isSubmitting || hasSubmittedResponse"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            @click.stop="submitResponse"
          >
            {{ isSubmitting ? 'Sending…' : 'Submit response' }}
          </button>
        </div>
      </div>

      <div v-else-if="event.humanInTheLoop.type === 'permission'">
        <!-- Yes/No Buttons for Permissions -->
        <div class="flex justify-end items-center gap-2">
          <span
            v-if="hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded'"
            class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--theme-accent-success)]/12 text-[var(--theme-accent-success)] border border-[var(--theme-accent-success)]/40"
          >
            Responded
          </span>
          <button
            :disabled="isSubmitting || hasSubmittedResponse"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--theme-accent-error)]/50 text-[var(--theme-accent-error)] hover:bg-[var(--theme-accent-error)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click.stop="submitPermission(false)"
          >
            <X :size="15" :stroke-width="2" /> Deny
          </button>
          <button
            :disabled="isSubmitting || hasSubmittedResponse"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--theme-accent-success)] hover:opacity-90 text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            @click.stop="submitPermission(true)"
          >
            <Check :size="15" :stroke-width="2" /> Approve
          </button>
        </div>
      </div>

      <div v-else-if="event.humanInTheLoop.type === 'choice'">
        <!-- Multiple Choice Buttons -->
        <div class="flex flex-wrap gap-2 justify-end">
          <button
            v-for="choice in event.humanInTheLoop.choices"
            :key="choice"
            :disabled="isSubmitting || hasSubmittedResponse"
            class="px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--theme-border-secondary)] text-[var(--theme-text-primary)] hover:border-[var(--theme-primary)] hover:bg-[var(--theme-hover-bg)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click.stop="submitChoice(choice)"
          >
            {{ choice }}
          </button>
        </div>
      </div>
    </div>

    <!-- Original Event Row Content (skip if HITL with humanInTheLoop) -->
    <div
      v-if="!event.humanInTheLoop"
      class="group relative flex rounded-xl border bg-[var(--theme-bg-primary)] overflow-hidden transition-colors duration-150 cursor-pointer"
      :class="
        isExpanded
          ? 'border-[var(--theme-primary)]/50 ring-1 ring-[var(--theme-primary)]/20'
          : 'border-[var(--theme-border-primary)] hover:border-[var(--theme-border-secondary)]'
      "
      @click="toggleExpanded"
    >
      <!-- App color spine -->
      <div class="w-1 shrink-0" :style="{ backgroundColor: appHexColor }"></div>

      <div class="flex-1 min-w-0 p-3 mobile:p-2.5">
        <!-- Meta row -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-x-2.5 gap-y-1 min-w-0 flex-wrap">
            <span
              class="inline-flex items-center gap-1.5 text-xs font-medium font-mono text-[var(--theme-text-primary)]"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :style="{ backgroundColor: appHexColor }"
              ></span>
              {{ event.source_app }}
            </span>
            <span class="text-xs font-mono text-[var(--theme-text-quaternary)]">{{
              sessionIdShort
            }}</span>
            <span
              v-if="event.model_name"
              class="inline-flex items-center gap-1 text-xs font-mono text-[var(--theme-text-tertiary)]"
              :title="`Model: ${event.model_name}`"
            >
              <Cpu :size="12" :stroke-width="1.75" />{{ formatModelName(event.model_name) }}
            </span>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]"
            >
              <component :is="hookIcon" :size="12" :stroke-width="1.75" class="shrink-0" />
              {{ event.hook_event_type }}
            </span>
            <span
              v-if="toolName"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono text-[var(--theme-text-tertiary)] border border-[var(--theme-border-primary)]"
            >
              <component :is="toolIcon" :size="12" :stroke-width="1.75" class="shrink-0" />{{
                toolName
              }}
            </span>
          </div>
          <span
            class="text-xs font-mono text-[var(--theme-text-quaternary)] tabular-nums shrink-0 pt-0.5"
          >
            {{ formatTime(event.timestamp) }}
          </span>
        </div>

        <!-- Tool detail + summary -->
        <div v-if="toolInfo || event.summary" class="mt-1.5 flex items-start justify-between gap-3">
          <div v-if="toolInfo" class="text-sm text-[var(--theme-text-secondary)] min-w-0 truncate">
            <span class="font-mono text-[var(--theme-text-primary)]">{{ toolInfo.tool }}</span>
            <span
              v-if="toolInfo.detail"
              class="ml-1.5 text-[var(--theme-text-tertiary)] font-mono"
              :class="{ italic: event.hook_event_type === 'UserPromptSubmit' }"
              >{{ toolInfo.detail }}</span
            >
          </div>
          <div
            v-if="event.summary"
            class="shrink-0 max-w-[45%] inline-flex items-center gap-1.5 text-xs text-[var(--theme-text-tertiary)]"
          >
            <FileText :size="12" :stroke-width="1.75" class="shrink-0" />
            <span class="truncate">{{ event.summary }}</span>
          </div>
        </div>

        <!-- Expanded content -->
        <div
          v-if="isExpanded"
          class="mt-3 pt-3 border-t border-[var(--theme-border-primary)] space-y-3"
          @click.stop
        >
          <!-- Payload -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span
                class="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-quaternary)]"
                >Payload</span
              >
              <button
                class="inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] transition-colors"
                @click.stop="copyPayload"
              >
                <component :is="copied ? Check : Copy" :size="13" :stroke-width="1.75" />
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
            </div>
            <pre
              class="text-xs leading-relaxed text-[var(--theme-on-dark)] bg-[var(--theme-surface-dark)] p-3 rounded-lg overflow-x-auto max-h-72 overflow-y-auto font-mono"
              >{{ formattedPayload }}</pre
            >
          </div>

          <!-- Chat transcript button (coral primary — scarce, intentional) -->
          <div v-if="event.chat && event.chat.length > 0" class="flex justify-end">
            <button
              :disabled="isMobile"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="
                isMobile
                  ? 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-quaternary)] cursor-not-allowed'
                  : 'bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white'
              "
              @click.stop="!isMobile && (showChatModal = true)"
            >
              <MessageSquare :size="15" :stroke-width="1.75" />
              {{
                isMobile ? 'Transcript (desktop only)' : `View Transcript · ${event.chat.length}`
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Chat Modal -->
    <ChatTranscriptModal
      v-if="event.chat && event.chat.length > 0"
      :is-open="showChatModal"
      :chat="event.chat"
      @close="showChatModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { HookEvent, HumanInTheLoopResponse } from '../types';
import { useMediaQuery } from '../composables/useMediaQuery';
import { useEventIcons } from '../composables/useEventIcons';
import ChatTranscriptModal from './ChatTranscriptModal.vue';
import {
  Cpu,
  FileText,
  Copy,
  Check,
  MessageSquare,
  Clock,
  X,
  CircleQuestionMark,
  Lock,
  ListChecks,
} from 'lucide-vue-next';
import { API_BASE_URL } from '../config';

const { getIconForEventType, getIconForToolName } = useEventIcons();

const props = defineProps<{
  event: HookEvent;
  appHexColor: string;
}>();

const emit = defineEmits<{
  (e: 'response-submitted', response: HumanInTheLoopResponse): void;
}>();

// Existing refs
const isExpanded = ref(false);
const showChatModal = ref(false);
const copied = ref(false);

// New refs for HITL
const responseText = ref('');
const isSubmitting = ref(false);
const hasSubmittedResponse = ref(false);
const localResponse = ref<HumanInTheLoopResponse | null>(null); // Optimistic UI

// Media query for responsive design
const { isMobile } = useMediaQuery();

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const sessionIdShort = computed(() => {
  return props.event.session_id.slice(0, 8);
});

const hookIcon = computed(() => getIconForEventType(props.event.hook_event_type));

const formattedPayload = computed(() => {
  return JSON.stringify(props.event.payload, null, 2);
});

const toolName = computed(() => {
  const eventType = props.event.hook_event_type;
  const toolEvents = ['PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest'];
  if (toolEvents.includes(eventType) && props.event.payload?.tool_name) {
    return props.event.payload.tool_name;
  }
  return null;
});

const toolIcon = computed(() => (toolName.value ? getIconForToolName(toolName.value) : null));

const toolInfo = computed(() => {
  const payload = props.event.payload;

  // Handle UserPromptSubmit events
  if (props.event.hook_event_type === 'UserPromptSubmit' && payload.prompt) {
    return {
      tool: 'Prompt:',
      detail: `"${payload.prompt.slice(0, 100)}${payload.prompt.length > 100 ? '...' : ''}"`,
    };
  }

  // Handle PreCompact events
  if (props.event.hook_event_type === 'PreCompact') {
    const trigger = payload.trigger || 'unknown';
    return {
      tool: 'Compaction:',
      detail: trigger === 'manual' ? 'Manual compaction' : 'Auto-compaction (full context)',
    };
  }

  // Handle SessionStart events
  if (props.event.hook_event_type === 'SessionStart') {
    const source = payload.source || 'unknown';
    const sourceLabels: Record<string, string> = {
      startup: 'New session',
      resume: 'Resuming session',
      clear: 'Fresh session',
    };
    return {
      tool: 'Session:',
      detail: sourceLabels[source] || source,
    };
  }

  // Handle tool-based events
  if (payload.tool_name) {
    const info: { tool: string; detail?: string } = { tool: payload.tool_name };

    if (payload.tool_input) {
      const input = payload.tool_input;
      if (input.command) {
        info.detail = input.command.slice(0, 50) + (input.command.length > 50 ? '...' : '');
      } else if (input.file_path) {
        info.detail = input.file_path.split('/').pop();
      } else if (input.pattern) {
        info.detail = input.pattern;
      } else if (input.url) {
        // WebFetch
        info.detail = input.url.slice(0, 60) + (input.url.length > 60 ? '...' : '');
      } else if (input.query) {
        // WebSearch
        info.detail = `"${input.query.slice(0, 50)}${input.query.length > 50 ? '...' : ''}"`;
      } else if (input.notebook_path) {
        // NotebookEdit
        info.detail = input.notebook_path.split('/').pop();
      } else if (input.recipient) {
        // SendMessage
        info.detail = `→ ${input.recipient}${input.summary ? ': ' + input.summary : ''}`;
      } else if (input.subject) {
        // TaskCreate
        info.detail = input.subject;
      } else if (input.taskId) {
        // TaskGet, TaskUpdate
        info.detail = `#${input.taskId}${input.status ? ' → ' + input.status : ''}`;
      } else if (input.description && input.subagent_type) {
        // Task (launch agent)
        info.detail = `${input.subagent_type}: ${input.description}`;
      } else if (input.task_id) {
        // TaskOutput, TaskStop
        info.detail = `task: ${input.task_id}`;
      } else if (input.team_name) {
        // TeamCreate
        info.detail = input.team_name;
      } else if (input.skill) {
        // Skill
        info.detail = input.skill;
      }
    }

    return info;
  }

  return null;
});

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

// Format model name for display (e.g., "claude-haiku-4-5-20251001" -> "haiku-4-5")
const formatModelName = (name: string | null | undefined): string => {
  if (!name) return '';

  // Extract model family and version
  // "claude-haiku-4-5-20251001" -> "haiku-4-5"
  // "claude-sonnet-4-5-20250929" -> "sonnet-4-5"
  const parts = name.split('-');
  if (parts.length >= 4) {
    return `${parts[1]}-${parts[2]}-${parts[3]}`;
  }
  return name;
};

const copyPayload = async () => {
  try {
    await navigator.clipboard.writeText(formattedPayload.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// New computed properties for HITL
const hitlTypeIcon = computed(() => {
  const iconMap: Record<string, typeof CircleQuestionMark> = {
    question: CircleQuestionMark,
    permission: Lock,
    choice: ListChecks,
  };
  return iconMap[props.event.humanInTheLoop?.type ?? ''] || CircleQuestionMark;
});

const hitlTypeLabel = computed(() => {
  if (!props.event.humanInTheLoop) return '';
  const labelMap = {
    question: 'Agent Question',
    permission: 'Permission Request',
    choice: 'Choice Required',
  };
  return labelMap[props.event.humanInTheLoop.type] || 'Question';
});

const permissionType = computed(() => {
  return props.event.payload?.permission_type || null;
});

// Methods for HITL responses
const submitResponse = async () => {
  if (!responseText.value.trim() || !props.event.id) return;

  const response: HumanInTheLoopResponse = {
    response: responseText.value.trim(),
    hookEvent: props.event,
    respondedAt: Date.now(),
  };

  // Optimistic UI: Show response immediately
  localResponse.value = response;
  hasSubmittedResponse.value = true;
  const savedText = responseText.value;
  responseText.value = '';
  isSubmitting.value = true;

  try {
    const res = await fetch(`${API_BASE_URL}/events/${props.event.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });

    if (!res.ok) throw new Error('Failed to submit response');

    emit('response-submitted', response);
  } catch (error) {
    console.error('Error submitting response:', error);
    // Rollback optimistic update
    localResponse.value = null;
    hasSubmittedResponse.value = false;
    responseText.value = savedText;
    alert('Failed to submit response. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const submitPermission = async (approved: boolean) => {
  if (!props.event.id) return;

  const response: HumanInTheLoopResponse = {
    permission: approved,
    hookEvent: props.event,
    respondedAt: Date.now(),
  };

  // Optimistic UI: Show response immediately
  localResponse.value = response;
  hasSubmittedResponse.value = true;
  isSubmitting.value = true;

  try {
    const res = await fetch(`${API_BASE_URL}/events/${props.event.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });

    if (!res.ok) throw new Error('Failed to submit permission');

    emit('response-submitted', response);
  } catch (error) {
    console.error('Error submitting permission:', error);
    // Rollback optimistic update
    localResponse.value = null;
    hasSubmittedResponse.value = false;
    alert('Failed to submit permission. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const submitChoice = async (choice: string) => {
  if (!props.event.id) return;

  const response: HumanInTheLoopResponse = {
    choice,
    hookEvent: props.event,
    respondedAt: Date.now(),
  };

  // Optimistic UI: Show response immediately
  localResponse.value = response;
  hasSubmittedResponse.value = true;
  isSubmitting.value = true;

  try {
    const res = await fetch(`${API_BASE_URL}/events/${props.event.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });

    if (!res.ok) throw new Error('Failed to submit choice');

    emit('response-submitted', response);
  } catch (error) {
    console.error('Error submitting choice:', error);
    // Rollback optimistic update
    localResponse.value = null;
    hasSubmittedResponse.value = false;
    alert('Failed to submit choice. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.95;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
</style>
