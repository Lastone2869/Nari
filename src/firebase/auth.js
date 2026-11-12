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

const newProfile = (name, email) => ({
  name,
  email,
  phone: '',
  trustedContacts: [],
  createdAt: serverTimestamp(),
});

export const registerWithEmail = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, 'users', cred.user.uid), newProfile(name, email));
  return cred.user;
};

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  const userRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, newProfile(cred.user.displayName || 'User', cred.user.email));
  }
  return cred.user;
};

export const loginAnonymously = () => signInAnonymously(auth);

/** Current user, or a fresh anonymous session so SOS and reports work without an account. */
export const ensureSignedIn = async () =>
  auth.currentUser ?? (await signInAnonymously(auth)).user;

export const logout = () => signOut(auth);

export const onAuth = (cb) => onAuthStateChanged(auth, cb);
