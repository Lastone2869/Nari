// src/firebase/firestore.js
import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, writeBatch, documentId,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { db } from './config';

// Live listener that maps docs to {id, ...data}. Errors (missing index, denied rule) are logged
// instead of silently leaving the UI empty.
const listen = (q, cb) =>
  onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error('Firestore listener failed', err)
  );

// ─── Reports ────────────────────────────────────────────────────────────────

// Reports are world readable, so they never carry the reporter's uid. When the reporter wants the
// report in "My Reports", its id is appended to their own profile instead.
export const addReport = async (data, linkToUid = null) => {
  const ref = doc(collection(db, 'reports'));
  const batch = writeBatch(db);
  batch.set(ref, { ...data, status: 'pending', createdAt: serverTimestamp() });
  if (linkToUid) batch.set(doc(db, 'users', linkToUid), { reportIds: arrayUnion(ref.id) }, { merge: true });
  await batch.commit();
  return ref.id;
};

export const getReport = async (id) => {
  const snap = await getDoc(doc(db, 'reports', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getRecentReports = (cb, limitCount = 20) =>
  listen(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(limitCount)), cb);

// shortcut: shows the newest 30 linked reports (Firestore `in` limit); paginate if anyone files more.
export const getUserReports = (userId, cb) => {
  let unsubReports = () => {};
  const unsubUser = onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      unsubReports();
      const ids = (snap.data()?.reportIds || []).slice(-30).reverse();
      if (!ids.length) return cb([]);
      unsubReports = listen(query(collection(db, 'reports'), where(documentId(), 'in', ids)), (reports) =>
        cb(ids.map((id) => reports.find((r) => r.id === id)).filter(Boolean))
      );
    },
    (err) => console.error('Firestore listener failed', err)
  );
  return () => { unsubUser(); unsubReports(); };
};

export const updateReportStatus = (id, status) =>
  updateDoc(doc(db, 'reports', id), { status });

// ─── Admin Methods ──────────────────────────────────────────────────────────

export const getAllUsersAdmin = (cb) =>
  listen(query(collection(db, 'users'), orderBy('createdAt', 'desc')), cb);

export const updateUserRole = (userId, role) =>
  updateDoc(doc(db, 'users', userId), { role });

// Removes the profile document only; the Auth account must be deleted from the Firebase console.
export const deleteUserAdmin = (userId) =>
  deleteDoc(doc(db, 'users', userId));

export const getAllReportsAdmin = (cb) =>
  listen(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), cb);

export const deleteReportAdmin = (id) =>
  deleteDoc(doc(db, 'reports', id));

// ─── Evidence ────────────────────────────────────────────────────────────────

export const addEvidence = async (data) => {
  const ref = await addDoc(collection(db, 'evidence'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserEvidence = (userId, cb) =>
  listen(query(collection(db, 'evidence'), where('userId', '==', userId), orderBy('createdAt', 'desc')), cb);

// ─── Live Tracking Alerts (Admin/Emergency) ────────────────────────────────

export const startLiveAlert = async (userId, lat, lng) => {
  const ref = await addDoc(collection(db, 'alerts'), {
    userId,
    isLive: true,
    status: 'active',
    currentLocation: { lat, lng },
    locationHistory: [{ lat, lng, timestamp: Date.now() }],
    startedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateLiveAlertLocation = (alertId, lat, lng) =>
  updateDoc(doc(db, 'alerts', alertId), {
    currentLocation: { lat, lng },
    locationHistory: arrayUnion({ lat, lng, timestamp: Date.now() })
  });

export const resolveLiveAlert = (alertId) =>
  updateDoc(doc(db, 'alerts', alertId), {
    isLive: false,
    status: 'resolved',
    endedAt: serverTimestamp(),
  });

export const subscribeToLiveAlertsAdmin = (cb) =>
  listen(query(collection(db, 'alerts'), where('status', '==', 'active')), (alerts) =>
    cb(alerts.filter((a) => a.isLive))
  );

// ─── Safe Spaces ─────────────────────────────────────────────────────────────

export const getSafeSpaces = async () => {
  const snap = await getDocs(collection(db, 'safe_spaces'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
