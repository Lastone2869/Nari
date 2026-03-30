// src/firebase/config.js
// Replace the placeholder values below with your actual Firebase project config.
// Get them from: Firebase Console → Project Settings → Your apps → SDK setup

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyD96GSBuf3REqZq48AoWhZBEIXLWO5V7-4",
  authDomain: "nari-safety-os.firebaseapp.com",
  projectId: "nari-safety-os",
  storageBucket: "nari-safety-os.firebasestorage.app",
  messagingSenderId: "283677412720",
  appId: "1:283677412720:web:56ca1070751633252c13b5",
  measurementId: "G-86JW2VPNTR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
