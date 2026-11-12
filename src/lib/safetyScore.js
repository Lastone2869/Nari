export const SEVERE_TYPES = new Set(['harassment', 'stalking']);

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Area score from recent community reports. Each severe incident weighs 6, any other 2, and the
// score falls on a smooth curve (weight 60 halves it) so a busy area never just pins to the floor.
// Reports older than 30 days are ignored; a report still waiting for its server timestamp counts.
// shortcut: ignores distance from the viewer, weight by distance once reports carry reliable coordinates.
export function safetyScore(reports, now = Date.now()) {
  const penalty = reports
    .filter((r) => now - (r.createdAt?.toMillis?.() ?? now) <= WINDOW_MS)
    .reduce((sum, r) => sum + (SEVERE_TYPES.has(r.type) ? 6 : 2), 0);
  return Math.round(100 / (1 + penalty / 60));
}
