export const SEVERE_TYPES = new Set(['harassment', 'stalking']);

// Area score from the loaded community reports: 100 minus 6 per severe incident
// and 2 per other incident, never below 5.
// shortcut: ignores distance and age of reports; weight by both once reports carry reliable coordinates and volume grows.
export function safetyScore(reports) {
  const penalty = reports.reduce((sum, r) => sum + (SEVERE_TYPES.has(r.type) ? 6 : 2), 0);
  return Math.max(5, 100 - penalty);
}
