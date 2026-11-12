export function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// Turns "Firebase: Error (auth/wrong-password)." into something a person can act on.
const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account with that email. Try registering.',
  'auth/email-already-in-use': 'That email is already registered. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export function authErrorMessage(err) {
  if (err?.code && AUTH_MESSAGES[err.code]) return AUTH_MESSAGES[err.code];
  const raw = err?.message?.replace('Firebase: ', '').replace(/\s*\(auth[^)]*\)\.?/, '').trim();
  return raw || 'Something went wrong.';
}
