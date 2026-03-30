// src/firebase/firestore.js
import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, GeoPoint
} from 'firebase/firestore';
import { db } from './config';

// ─── Reports ────────────────────────────────────────────────────────────────

export const addReport = async (data) => {
  const ref = await addDoc(collection(db, 'reports'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getReport = async (id) => {
  const snap = await getDoc(doc(db, 'reports', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getRecentReports = (cb, limitCount = 20) => {
  const q = query(
    collection(db, 'reports'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const getUserReports = (userId, cb) => {
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const updateReportStatus = (id, status) =>
  updateDoc(doc(db, 'reports', id), { status });

// ─── Evidence ────────────────────────────────────────────────────────────────

export const addEvidence = async (data) => {
  const ref = await addDoc(collection(db, 'evidence'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserEvidence = (userId, cb) => {
  const q = query(
    collection(db, 'evidence'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const addAlert = async (userId, lat, lng, sentTo = []) => {
  const ref = await addDoc(collection(db, 'alerts'), {
    userId,
    location: new GeoPoint(lat, lng),
    status: 'active',
    sentTo,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getActiveAlerts = (cb) => {
  const q = query(
    collection(db, 'alerts'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

// ─── Safe Spaces ─────────────────────────────────────────────────────────────

export const getSafeSpaces = async () => {
  const snap = await getDocs(collection(db, 'safe_spaces'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const seedSafeSpaces = async () => {
  const spaces = [
    { name: 'Police Station – Sector 4', type: 'police', location: { lat: 28.6139, lng: 77.209 }, verified: true, rating: 4.2 },
    { name: 'City Hospital', type: 'hospital', location: { lat: 28.6200, lng: 77.2100 }, verified: true, rating: 4.5 },
    { name: 'Women Safe Zone Hub', type: 'safe_zone', location: { lat: 28.6100, lng: 77.2050 }, verified: true, rating: 4.8 },
  ];
  for (const space of spaces) {
    await addDoc(collection(db, 'safe_spaces'), space);
  }
};
