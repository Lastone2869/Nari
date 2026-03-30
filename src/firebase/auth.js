// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

export const registerWithEmail = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    phone: '',
    trustedContacts: [],
    createdAt: serverTimestamp(),
  });
  return cred.user;
};

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  const userRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name: cred.user.displayName || 'User',
      email: cred.user.email,
      phone: '',
      trustedContacts: [],
      createdAt: serverTimestamp(),
    });
  }
  return cred.user;
};

export const loginAnonymously = () => signInAnonymously(auth);

// [Admin Testing Bailout]
export const loginAsMagicAdmin = async () => {
  const cred = await signInAnonymously(auth);
  await setDoc(doc(db, 'users', cred.user.uid), {
    name: 'Magic Admin',
    email: 'admin@nari.local',
    phone: '000-000-0000',
    trustedContacts: [],
    role: 'admin',
    createdAt: serverTimestamp(),
  });
  return cred.user;
};

export const logout = () => signOut(auth);

export const onAuth = (cb) => onAuthStateChanged(auth, cb);
