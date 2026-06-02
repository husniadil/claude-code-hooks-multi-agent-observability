const eventTypeToEmoji: Record<string, string> = {
  'PreToolUse': '🔧',
  'PostToolUse': '✅',
  'PostToolUseFailure': '❌',
  'PermissionRequest': '🔐',
  'Notification': '🔔',
  'Stop': '🛑',
  'SubagentStart': '🟢',
  'SubagentStop': '👥',
  'PreCompact': '📦',
  'UserPromptSubmit': '💬',
  'SessionStart': '🚀',
  'SessionEnd': '🏁',
  'TaskCreated': '📋',
  'TaskCompleted': '☑️',
  'TeammateIdle': '😴',
  // Default
  'default': '❓'
};

const toolNameToEmoji: Record<string, string> = {
  'Bash': '💻',
  'Read': '📖',
  'Write': '✍️',
  'Edit': '✏️',
  'MultiEdit': '✏️',
  'Glob': '🔍',
  'Grep': '🔎',
  'WebFetch': '🌐',
  'WebSearch': '🔍',
  'NotebookEdit': '📓',
  'Task': '🤖',
  'TaskCreate': '📋',
  'TaskGet': '📄',
  'TaskUpdate': '📝',
  'TaskList': '📑',
  'TaskOutput': '📤',
  'TaskStop': '⏹️',
  'TeamCreate': '👥',
  'TeamDelete': '🗑️',
  'SendMessage': '💬',
  'EnterPlanMode': '🗺️',
  'ExitPlanMode': '🚪',
  'AskUserQuestion': '❓',
  'Skill': '⚡',
  // Default
  'default': '🔧'
};

export function useEventEmojis() {
  const getEmojiForEventType = (eventType: string): string => {
    return eventTypeToEmoji[eventType] || eventTypeToEmoji.default;
  };

  const getEmojiForToolName = (toolName: string): string => {
    // Check exact match first, then check for MCP tools (prefixed with mcp__)
    if (toolNameToEmoji[toolName]) return toolNameToEmoji[toolName];
    if (toolName.startsWith('mcp__')) return '🔌';
    return toolNameToEmoji.default;
  };
  
  const formatEventTypeLabel = (eventTypes: Record<string, number>, toolEvents?: Record<string, number>): string => {
    // Prefer toolEvents when available (shows combo emojis like 🔧💻)
    if (toolEvents && Object.keys(toolEvents).length > 0) {
      // Merge tool events with non-tool event types
      const allEntries: Array<[string, number, string]> = []; // [key, count, emoji]

      // Add tool event combos (e.g., "PreToolUse:Bash" → 🔧-💻)
      for (const [key, count] of Object.entries(toolEvents)) {
        const [eventType, toolName] = key.split(':');
        const combo = `${getEmojiForEventType(eventType)}+${getEmojiForToolName(toolName)}`;
        allEntries.push([key, count, combo]);
      }

      // Add non-tool event types that aren't covered by toolEvents
      const toolEventTypes = new Set(Object.keys(toolEvents).map(k => k.split(':')[0]));
      for (const [type, count] of Object.entries(eventTypes)) {
        if (!toolEventTypes.has(type)) {
          allEntries.push([type, count, getEmojiForEventType(type)]);
        }
      }

      // Sort by count descending, show top 3
      allEntries.sort((a, b) => b[1] - a[1]);
      const topEntries = allEntries.slice(0, 3);

      return topEntries
        .map(([, count, emoji]) => count > 1 ? `${emoji}×${count}` : emoji)
        .join('');
    }

    // Fallback: event types only
    const entries = Object.entries(eventTypes)
      .sort((a, b) => b[1] - a[1]); // Sort by count descending

    if (entries.length === 0) return '';

    // Show up to 3 most frequent event types
    const topEntries = entries.slice(0, 3);

    return topEntries
      .map(([type, count]) => {
        const emoji = getEmojiForEventType(type);
        return count > 1 ? `${emoji}×${count}` : emoji;
      })
      .join('');
  };
  
  return {
    getEmojiForEventType,
    getEmojiForToolName,
    formatEventTypeLabel
  };
}