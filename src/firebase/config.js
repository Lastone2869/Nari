// src/firebase/config.js
// Firebase web config is a public identifier, not a secret: access is enforced by
// firestore.rules / storage.rules (and App Check if enabled), never by hiding these values.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD96GSBuf3REqZq48AoWhZBEIXLWO5V7-4",
  authDomain: "nari-safety-os.firebaseapp.com",
  projectId: "nari-safety-os",
  storageBucket: "nari-safety-os.firebasestorage.app",
  messagingSenderId: "283677412720",
  appId: "1:283677412720:web:56ca1070751633252c13b5",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
