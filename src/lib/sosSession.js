// Live SOS state that must outlive the Home page: trackers and recorders keep running
// while the user browses other pages, and Home re-reads this on mount.
// shortcut: lost on a full page reload; move alert IDs to localStorage if that matters.
export const sosSession = {
  sosTracker: null,     // { stop } from Home's startTracking
  shareTracker: null,
  shareUrl: '',
  audioRecorder: null,  // MediaRecorder instances
  videoRecorder: null,
};
