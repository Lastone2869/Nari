import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safetyScore } from '../src/lib/safetyScore.js';
import { REPORT_STATUSES } from '../src/lib/reportStatus.js';

test('no reports means a perfect score', () => {
  assert.equal(safetyScore([]), 100);
});

test('severe incidents cost more than minor ones', () => {
  assert.equal(safetyScore([{ type: 'harassment' }]), 94);
  assert.equal(safetyScore([{ type: 'poor_lighting' }]), 98);
  assert.equal(safetyScore([{ type: 'stalking' }, { type: 'theft' }, { type: undefined }]), 90);
});

test('score never drops below the floor', () => {
  assert.equal(safetyScore(Array.from({ length: 100 }, () => ({ type: 'harassment' }))), 5);
});

test('report lifecycle starts pending and ends closed', () => {
  assert.equal(REPORT_STATUSES[0], 'pending');
  assert.equal(REPORT_STATUSES.at(-1), 'closed');
  assert.equal(new Set(REPORT_STATUSES).size, REPORT_STATUSES.length);
});
