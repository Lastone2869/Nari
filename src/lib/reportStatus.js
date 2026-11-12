// Complaint lifecycle, in order. Shared by the user timeline (Track), the admin status control and the rules tests.
export const REPORT_STATUSES = ['pending', 'verified', 'reviewing', 'escalated', 'resolved', 'closed'];

/** Index of the status in the lifecycle (-1 if unknown) and the percentage shown on the progress bar. */
export function reportProgress(status) {
  const step = REPORT_STATUSES.indexOf(status);
  return { step, pct: step < 0 ? 0 : Math.round(((step + 1) / REPORT_STATUSES.length) * 100) };
}
