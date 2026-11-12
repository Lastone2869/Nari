import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtSize, authErrorMessage } from '../src/lib/format.js';
import { reportProgress, REPORT_STATUSES } from '../src/lib/reportStatus.js';

test('fmtSize picks the unit at each boundary', () => {
  assert.equal(fmtSize(0), '0 B');
  assert.equal(fmtSize(1023), '1023 B');
  assert.equal(fmtSize(1024), '1.0 KB');
  assert.equal(fmtSize(1048575), '1024.0 KB');
  assert.equal(fmtSize(1048576), '1.0 MB');
  assert.equal(fmtSize(50 * 1024 * 1024), '50.0 MB');
});

test('authErrorMessage maps known Firebase codes to plain language', () => {
  assert.equal(authErrorMessage({ code: 'auth/wrong-password', message: 'Firebase: Error (auth/wrong-password).' }), 'Email or password is incorrect.');
  assert.equal(authErrorMessage({ code: 'auth/weak-password' }), 'Password must be at least 6 characters.');
});

test('authErrorMessage strips Firebase noise from unknown errors', () => {
  assert.equal(authErrorMessage({ code: 'auth/other', message: 'Firebase: Something odd (auth/other).' }), 'Something odd');
  assert.equal(authErrorMessage(new Error('Boom')), 'Boom');
  assert.equal(authErrorMessage(undefined), 'Something went wrong.');
  assert.equal(authErrorMessage({ message: '' }), 'Something went wrong.');
});

test('reportProgress walks the lifecycle and rejects unknown statuses', () => {
  assert.deepEqual(reportProgress('pending'), { step: 0, pct: 17 });
  assert.deepEqual(reportProgress('closed'), { step: REPORT_STATUSES.length - 1, pct: 100 });
  assert.deepEqual(reportProgress('bogus'), { step: -1, pct: 0 });
  assert.deepEqual(reportProgress(undefined), { step: -1, pct: 0 });
});
