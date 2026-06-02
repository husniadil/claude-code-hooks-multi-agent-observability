#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "anthropic",
#     "python-dotenv",
# ]
# ///

"""
Multi-Agent Observability Hook Script
Sends Claude Code hook events to the observability server.

Supported event types (26 total):
  SessionStart, SessionEnd, UserPromptSubmit, UserPromptExpansion, PreToolUse,
  PostToolUse, PostToolUseFailure, PostToolBatch, PermissionRequest,
  PermissionDenied, Notification, SubagentStart, SubagentStop, Stop,
  StopFailure, PreCompact, PostCompact, TaskCreated, TaskCompleted,
  TeammateIdle, ConfigChange, CwdChanged, InstructionsLoaded, Setup,
  Elicitation, ElicitationResult

Not observed (don't fit the passive observe-only model):
  WorktreeCreate/WorktreeRemove (replace VCS behavior), FileChanged (matcher is
  the watch-list), MessageDisplay (high-frequency display event)
"""

import json
import sys
import os
import argparse
import urllib.request
import urllib.error
from datetime import datetime
from utils.summarizer import generate_event_summary
from utils.model_extractor import get_model_from_transcript

def send_event_to_server(event_data, server_url='http://localhost:4000/events'):
    """Send event data to the observability server."""
    try:
        # Prepare the request
        req = urllib.request.Request(
            server_url,
            data=json.dumps(event_data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Claude-Code-Hook/1.0'
            }
        )
        
        # Send the request
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                return True
            else:
                print(f"Server returned status: {response.status}", file=sys.stderr)
                return False
                
    except urllib.error.URLError as e:
        print(f"Failed to send event: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return False

def _is_renderable(entry):
    """Whether a transcript line carries content the dashboard chat renders."""
    t = entry.get('type')
    if t in ('user', 'assistant'):
        return True
    if t == 'system':
        # The client renders a system line's content and/or its toolUseID; keep
        # those, drop blank markers (e.g. the post-compact root) that render empty.
        return bool(entry.get('content') or entry.get('toolUseID'))
    return False


def reconstruct_active_chat(lines):
    """Reduce an append-only transcript tree to its live linear conversation.

    A Claude Code transcript .jsonl is an append-only TREE: each message line
    carries `uuid` + `parentUuid`. Rewind and /compact FORK the tree — the old
    branch stays in the file and a new branch is appended. Dumping every line
    (the old behavior) therefore stored dead/abandoned branches ("rewind
    ghosts") and re-ballooned the whole history on every Stop (O(N^2) bloat).

    We keep only the live branch. Invariant: Stop/SubagentStop fire right after
    a fresh append, so the LAST physical uuid-bearing line is guaranteed to sit
    on the live branch. Walk `parentUuid` from it to the root to get the active
    path, then emit only the renderable message lines in file order.

    Non-message metadata (file-history-snapshot, ai-title, mode, ...) and
    attachment lines carry nothing the dashboard renders and are dropped;
    attachment lines still participate in the walk as path links.

    Returns (active_chat, pruned_messages) where pruned_messages is the number
    of *renderable* message lines that exist in the file but were dropped for
    sitting off the live branch (the rewind/compaction ghosts) — it excludes
    metadata/attachment lines, which were never chat to begin with.
    """
    renderable_total = sum(1 for e in lines if _is_renderable(e))

    nodes = {}
    last_uuid = None
    for entry in lines:
        u = entry.get('uuid')
        if u:
            nodes[u] = entry
            last_uuid = u

    if last_uuid is None:
        # No tree info (unexpected format) — fall back to renderable lines.
        chat = [e for e in lines if _is_renderable(e)]
        return chat, renderable_total - len(chat)

    active = set()
    cur = last_uuid
    while cur and cur in nodes and cur not in active:
        active.add(cur)
        cur = nodes[cur].get('parentUuid')

    chat = [e for e in lines if e.get('uuid') in active and _is_renderable(e)]
    return chat, renderable_total - len(chat)


def main():
    # Capture the timestamp as early as possible so it tracks when the hook
    # fired, not when the (now async) process finishes its transcript read /
    # summary. This keeps event ordering close to fire-order.
    event_timestamp = int(datetime.now().timestamp() * 1000)

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Send Claude Code hook events to observability server')
    parser.add_argument('--source-app', required=True, help='Source application name')
    parser.add_argument('--event-type', required=True, help='Hook event type (PreToolUse, PostToolUse, etc.)')
    parser.add_argument('--server-url', default='http://localhost:4000/events', help='Server URL')
    parser.add_argument('--add-chat', action='store_true', help='Include chat transcript if available')
    parser.add_argument('--summarize', action='store_true', help='Generate AI summary of the event')
    
    args = parser.parse_args()
    
    try:
        # Read hook data from stdin
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Extract model name from transcript (with caching)
    session_id = input_data.get('session_id', 'unknown')
    transcript_path = input_data.get('transcript_path', '')
    model_name = ''
    if transcript_path:
        model_name = get_model_from_transcript(session_id, transcript_path)

    # Prepare event data for server
    event_data = {
        'source_app': args.source_app,
        'session_id': session_id,
        'hook_event_type': args.event_type,
        'payload': input_data,
        'timestamp': event_timestamp,
        'model_name': model_name
    }

    # Event-specific fields (tool_name, agent_id, source, etc.) are kept inside
    # `payload` only. The server persists a fixed set of columns and rebuilds
    # events from those on reload, so forwarding these as top-level properties
    # was dropped on refresh and read by nothing on the client (consumers read
    # from `payload.*`). See payload above for the full hook input.

    # Handle --add-chat option. For SubagentStop the subagent's own transcript
    # lives in a separate file (agent_transcript_path); prefer it so the event
    # carries the subagent's conversation, not the parent session's. Falls back
    # to transcript_path (the main session) for all other events.
    if args.add_chat:
        chat_path = input_data.get('agent_transcript_path') or input_data.get('transcript_path')
        if chat_path and os.path.exists(chat_path):
            # Read .jsonl into a list of parsed lines (file order).
            lines = []
            try:
                with open(chat_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                lines.append(json.loads(line))
                            except json.JSONDecodeError:
                                pass  # Skip invalid lines

                # Prune the append-only tree to its live linear conversation so
                # rewound/compacted-away branches aren't stored as if active.
                chat, pruned_msgs = reconstruct_active_chat(lines)
                event_data['chat'] = chat
                pruned_meta = len(lines) - len(chat) - pruned_msgs
                if pruned_msgs or pruned_meta:
                    print(
                        f"add-chat: kept {len(chat)} message(s); pruned "
                        f"{pruned_msgs} off-path + {pruned_meta} non-message line(s)",
                        file=sys.stderr,
                    )
            except Exception as e:
                print(f"Failed to read transcript: {e}", file=sys.stderr)
    
    # Generate summary if requested
    if args.summarize:
        summary = generate_event_summary(event_data)
        if summary:
            event_data['summary'] = summary
        # Continue even if summary generation fails
    
    # Send to server
    success = send_event_to_server(event_data, args.server_url)
    
    # Always exit with 0 to not block Claude Code operations
    sys.exit(0)

if __name__ == '__main__':
    main()