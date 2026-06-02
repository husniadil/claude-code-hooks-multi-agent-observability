import type { HookEvent } from '../types';

/**
 * Insert an event into an array kept in ascending timestamp order, in place.
 *
 * Async send_event hooks can deliver POSTs slightly out of fire-order (a slow
 * --summarize lets a later event overtake an earlier one), so we can't assume
 * arrivals are sorted. The common case is still a plain append, so we scan back
 * from the end and drop the event into place. Ties (equal timestamp) keep
 * arrival order, which matches the server's `ORDER BY timestamp, id`.
 */
export function insertEventSorted(events: HookEvent[], newEvent: HookEvent): void {
  const ts = newEvent.timestamp ?? 0;
  let i = events.length;
  while (i > 0 && (events[i - 1].timestamp ?? 0) > ts) i--;
  events.splice(i, 0, newEvent);
}
