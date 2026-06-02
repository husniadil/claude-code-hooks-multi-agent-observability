import type { HookEvent } from '../types';

// Extract searchable text from an event. Pure function (no Vue deps, testable):
// reads the real data locations — model_name column, payload.* for tool fields,
// and the humanInTheLoop object — not legacy top-level fields that never
// existed on HookEvent.
export function getSearchableText(event: HookEvent): string {
  const parts: string[] = [];

  // Event type
  if (event.hook_event_type) {
    parts.push(event.hook_event_type);
  }

  // Source app and session
  if (event.source_app) {
    parts.push(event.source_app);
  }
  if (event.session_id) {
    parts.push(event.session_id);
  }

  // Model name
  if (event.model_name) {
    parts.push(event.model_name);
  }

  // Tool information (lives in payload)
  if (event.payload?.tool_name) {
    parts.push(event.payload.tool_name);
  }
  if (event.payload?.tool_input?.command) {
    parts.push(event.payload.tool_input.command);
  }
  if (event.payload?.tool_input?.file_path) {
    parts.push(event.payload.tool_input.file_path);
  }

  // Summary text
  if (event.summary) {
    parts.push(event.summary);
  }

  // HITL information
  if (event.humanInTheLoop?.question) {
    parts.push(event.humanInTheLoop.question);
  }
  if (event.humanInTheLoop?.type) {
    parts.push(event.humanInTheLoop.type);
  }

  return parts.join(' ').toLowerCase();
}
