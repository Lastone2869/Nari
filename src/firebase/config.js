// src/firebase/config.js
// Firebase web config is a public identifier, not a secret: access is enforced by
// firestore.rules / storage.rules and App Check, never by hiding these values.
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyD96GSBuf3REqZq48AoWhZBEIXLWO5V7-4",
  authDomain: "nari-safety-os.firebaseapp.com",
  projectId: "nari-safety-os",
  storageBucket: "nari-safety-os.firebasestorage.app",
  messagingSenderId: "283677412720",
  appId: "1:283677412720:web:56ca1070751633252c13b5",
};

const app = initializeApp(firebaseConfig);

// Abuse protection: set VITE_RECAPTCHA_SITE_KEY and enforce App Check in the Firebase console.
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (siteKey) {
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// `VITE_USE_EMULATORS=1 npm run dev` targets the local emulators (see README, "Testing").
if (import.meta.env.VITE_USE_EMULATORS) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export default app;
