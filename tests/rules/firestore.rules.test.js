// Integration tests for firestore.rules against the Firestore emulator.
// Run with: npm run test:rules   (starts the emulator, runs this file, stops it)
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, arrayUnion } from 'firebase/firestore';

const PROJECT = 'nari-rules-test';
let env;

const ALICE = 'alice';
const BOB = 'bob';
const ADMIN = 'root';

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // Seed without rules: profiles, one report, one evidence doc, one alert.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', ALICE), { name: 'Alice', email: 'a@x', reportIds: [] });
    await setDoc(doc(db, 'users', BOB), { name: 'Bob', email: 'b@x' });
    await setDoc(doc(db, 'users', ADMIN), { name: 'Root', email: 'r@x', role: 'admin' });
    await setDoc(doc(db, 'reports', 'r1'), { type: 'theft', description: 'x', status: 'pending', anonymous: false });
    await setDoc(doc(db, 'evidence', 'e1'), { userId: ALICE, fileName: 'a.jpg', hash: 'abc' });
    await setDoc(doc(db, 'alerts', 'al1'), { userId: ALICE, status: 'active', isLive: true, currentLocation: { lat: 1, lng: 2 } });
    await setDoc(doc(db, 'safe_spaces', 's1'), { name: 'Police', type: 'police', location: { lat: 1, lng: 2 } });
  });
});

const as = (uid) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());

// ── users ──────────────────────────────────────────────────────────────────────

test('a user can read their own profile but not someone else\'s', async () => {
  await assertSucceeds(getDoc(doc(as(ALICE), 'users', ALICE)));
  await assertFails(getDoc(doc(as(ALICE), 'users', BOB)));
  await assertFails(getDoc(doc(as(null), 'users', ALICE)));
});

test('admin can read and delete any profile', async () => {
  await assertSucceeds(getDoc(doc(as(ADMIN), 'users', BOB)));
  await assertSucceeds(getDocs(collection(as(ADMIN), 'users')));
  await assertSucceeds(deleteDoc(doc(as(ADMIN), 'users', BOB)));
  await assertFails(deleteDoc(doc(as(ALICE), 'users', BOB)));
});

test('a user can edit their profile fields but never the role (the old admin backdoor)', async () => {
  await assertSucceeds(updateDoc(doc(as(ALICE), 'users', ALICE), { name: 'Alicia', phone: '123' }));
  await assertFails(updateDoc(doc(as(ALICE), 'users', ALICE), { role: 'admin' }));
  await assertFails(setDoc(doc(as(ALICE), 'users', ALICE), { role: 'admin' }, { merge: true }));
  await assertFails(setDoc(doc(as('newbie'), 'users', 'newbie'), { name: 'N', role: 'admin' }));
  await assertSucceeds(setDoc(doc(as('newbie'), 'users', 'newbie'), { name: 'N', email: 'n@x' }));
});

test('only an admin can grant or revoke admin', async () => {
  await assertFails(updateDoc(doc(as(BOB), 'users', ALICE), { role: 'admin' }));
  await assertSucceeds(updateDoc(doc(as(ADMIN), 'users', BOB), { role: 'admin' }));
  await assertSucceeds(updateDoc(doc(as(ADMIN), 'users', BOB), { role: 'user' }));
});

test('a user may link report ids to their own profile only', async () => {
  await assertSucceeds(setDoc(doc(as(ALICE), 'users', ALICE), { reportIds: arrayUnion('r1') }, { merge: true }));
  await assertFails(setDoc(doc(as(ALICE), 'users', BOB), { reportIds: arrayUnion('r1') }, { merge: true }));
});

// ── reports ────────────────────────────────────────────────────────────────────

test('reports are public to read, even signed out', async () => {
  await assertSucceeds(getDoc(doc(as(null), 'reports', 'r1')));
  await assertSucceeds(getDocs(collection(as(null), 'reports')));
});

test('creating a report needs sign-in, pending status, bounded description and no reporter uid', async () => {
  const ok = { type: 'harassment', description: 'desc', status: 'pending', anonymous: true, location: null };
  await assertSucceeds(setDoc(doc(as(ALICE), 'reports', 'new1'), ok));
  await assertFails(setDoc(doc(as(null), 'reports', 'new2'), ok));
  await assertFails(setDoc(doc(as(ALICE), 'reports', 'new3'), { ...ok, status: 'verified' }));
  await assertFails(setDoc(doc(as(ALICE), 'reports', 'new4'), { ...ok, description: 'x'.repeat(2001) }));
  await assertFails(setDoc(doc(as(ALICE), 'reports', 'new5'), { ...ok, userId: ALICE }));
  await assertFails(setDoc(doc(as(ALICE), 'reports', 'new6'), { ...ok, type: 42 }));
});

test('only admins can change status or delete a report', async () => {
  await assertFails(updateDoc(doc(as(ALICE), 'reports', 'r1'), { status: 'resolved' }));
  await assertFails(deleteDoc(doc(as(ALICE), 'reports', 'r1')));
  await assertSucceeds(updateDoc(doc(as(ADMIN), 'reports', 'r1'), { status: 'resolved' }));
  await assertSucceeds(deleteDoc(doc(as(ADMIN), 'reports', 'r1')));
});

// ── evidence ───────────────────────────────────────────────────────────────────

test('evidence is private to its owner and visible to admins', async () => {
  await assertSucceeds(getDoc(doc(as(ALICE), 'evidence', 'e1')));
  await assertFails(getDoc(doc(as(BOB), 'evidence', 'e1')));
  await assertFails(getDoc(doc(as(null), 'evidence', 'e1')));
  await assertSucceeds(getDoc(doc(as(ADMIN), 'evidence', 'e1')));
  await assertSucceeds(getDocs(query(collection(as(ALICE), 'evidence'), where('userId', '==', ALICE))));
  await assertFails(getDocs(query(collection(as(BOB), 'evidence'), where('userId', '==', ALICE))));
});

test('evidence can only be created for yourself and is immutable afterwards', async () => {
  await assertSucceeds(setDoc(doc(as(BOB), 'evidence', 'e2'), { userId: BOB, fileName: 'b.png', hash: 'h' }));
  await assertFails(setDoc(doc(as(BOB), 'evidence', 'e3'), { userId: ALICE, fileName: 'b.png', hash: 'h' }));
  await assertFails(updateDoc(doc(as(ALICE), 'evidence', 'e1'), { hash: 'tampered' }));
  await assertFails(deleteDoc(doc(as(ALICE), 'evidence', 'e1')));
  await assertSucceeds(deleteDoc(doc(as(ADMIN), 'evidence', 'e1')));
});

// ── alerts ─────────────────────────────────────────────────────────────────────

test('alerts: owner and admin can see and resolve, strangers cannot', async () => {
  await assertSucceeds(getDoc(doc(as(ALICE), 'alerts', 'al1')));
  await assertFails(getDoc(doc(as(BOB), 'alerts', 'al1')));
  await assertSucceeds(getDocs(query(collection(as(ADMIN), 'alerts'), where('status', '==', 'active'))));
  await assertFails(getDocs(query(collection(as(BOB), 'alerts'), where('status', '==', 'active'))));
  await assertSucceeds(updateDoc(doc(as(ALICE), 'alerts', 'al1'), { currentLocation: { lat: 3, lng: 4 } }));
  await assertSucceeds(updateDoc(doc(as(ADMIN), 'alerts', 'al1'), { status: 'resolved', isLive: false }));
  await assertFails(updateDoc(doc(as(BOB), 'alerts', 'al1'), { status: 'resolved' }));
  await assertSucceeds(setDoc(doc(as(BOB), 'alerts', 'al2'), { userId: BOB, status: 'active', isLive: true }));
  await assertFails(setDoc(doc(as(BOB), 'alerts', 'al3'), { userId: ALICE, status: 'active', isLive: true }));
});

// ── safe spaces ────────────────────────────────────────────────────────────────

test('safe spaces are public to read and admin-only to write', async () => {
  await assertSucceeds(getDocs(collection(as(null), 'safe_spaces')));
  await assertFails(setDoc(doc(as(ALICE), 'safe_spaces', 's2'), { name: 'Fake', type: 'police' }));
  await assertSucceeds(setDoc(doc(as(ADMIN), 'safe_spaces', 's2'), { name: 'Hospital', type: 'hospital' }));
});
