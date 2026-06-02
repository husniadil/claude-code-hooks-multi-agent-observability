import { test, expect, describe } from 'bun:test';
import { insertEventSorted } from './eventOrdering';
import type { HookEvent } from '../types';

const ev = (id: number, timestamp: number): HookEvent => ({
  id,
  source_app: 'app',
  session_id: 's',
  hook_event_type: 'X',
  payload: {},
  timestamp,
});

const order = (events: HookEvent[]) => events.map(e => e.id);

describe('insertEventSorted', () => {
  test('in-order arrivals just append', () => {
    const events: HookEvent[] = [];
    [ev(1, 100), ev(2, 200), ev(3, 300)].forEach(e => insertEventSorted(events, e));
    expect(order(events)).toEqual([1, 2, 3]);
  });

  test('a late (older-timestamp) arrival is placed by timestamp', () => {
    const events: HookEvent[] = [];
    // arrival order: 100, 300, 200  (200 arrives after 300 — async overtake)
    [ev(1, 100), ev(3, 300), ev(2, 200)].forEach(e => insertEventSorted(events, e));
    expect(order(events)).toEqual([1, 2, 3]);
    expect(events.map(e => e.timestamp)).toEqual([100, 200, 300]);
  });

  test('ties keep arrival order (matches server ORDER BY timestamp, id)', () => {
    const events: HookEvent[] = [];
    // two events share timestamp 200; first arrival (id 5) should stay first
    [ev(1, 100), ev(5, 200), ev(6, 200), ev(2, 300)].forEach(e => insertEventSorted(events, e));
    expect(order(events)).toEqual([1, 5, 6, 2]);
  });

  test('missing timestamp is treated as oldest', () => {
    const events: HookEvent[] = [];
    [ev(1, 100), ev(2, 200)].forEach(e => insertEventSorted(events, e));
    const noTs = ev(9, 0);
    delete (noTs as any).timestamp;
    insertEventSorted(events, noTs);
    expect(order(events)[0]).toBe(9);
  });
});
