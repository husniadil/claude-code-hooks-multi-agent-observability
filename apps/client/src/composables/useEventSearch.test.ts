import { test, expect, describe } from 'bun:test';
import { getSearchableText } from '../utils/eventSearchText';
import type { HookEvent } from '../types';

const base = (over: Partial<HookEvent> = {}): HookEvent => ({
  source_app: 'app-a',
  session_id: 'sess-123',
  hook_event_type: 'PreToolUse',
  payload: {},
  ...over,
});

describe('getSearchableText', () => {
  test('includes core columns and lowercases', () => {
    const text = getSearchableText(base({ summary: 'Reads Config File' }));
    expect(text).toContain('pretooluse');
    expect(text).toContain('app-a');
    expect(text).toContain('sess-123');
    expect(text).toContain('reads config file');
  });

  test('reads tool fields from payload, not top level', () => {
    const text = getSearchableText(
      base({ payload: { tool_name: 'Bash', tool_input: { command: 'npm test' } } })
    );
    expect(text).toContain('bash');
    expect(text).toContain('npm test');
  });

  test('reads tool_input.file_path from payload', () => {
    const text = getSearchableText(
      base({ payload: { tool_name: 'Edit', tool_input: { file_path: '/src/db.ts' } } })
    );
    expect(text).toContain('/src/db.ts');
  });

  test('reads model_name column, not legacy event.model', () => {
    const text = getSearchableText(base({ model_name: 'claude-opus-4-8' }));
    expect(text).toContain('claude-opus-4-8');
  });

  test('reads humanInTheLoop question and type', () => {
    const text = getSearchableText(
      base({ humanInTheLoop: { question: 'Deploy to prod?', type: 'permission', responseWebSocketUrl: '' } })
    );
    expect(text).toContain('deploy to prod?');
    expect(text).toContain('permission');
  });

  test('regression: legacy top-level tool_name is NOT indexed (must live in payload)', () => {
    // The bug we fixed: search read event.tool_name (never populated) instead of payload.tool_name
    const legacy = base();
    (legacy as any).tool_name = 'Bash';
    expect(getSearchableText(legacy)).not.toContain('bash');
  });

  test('handles missing optional fields without throwing', () => {
    expect(() => getSearchableText(base({ payload: undefined as any }))).not.toThrow();
  });
});
