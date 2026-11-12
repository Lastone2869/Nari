import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safetyScore } from '../src/lib/safetyScore.js';
import { REPORT_STATUSES } from '../src/lib/reportStatus.js';

const NOW = Date.UTC(2026, 10, 12);
const DAY = 24 * 60 * 60 * 1000;
const at = (daysAgo, type = 'theft') => ({ type, createdAt: { toMillis: () => NOW - daysAgo * DAY } });

test('no reports means a perfect score', () => {
  assert.equal(safetyScore([], NOW), 100);
});

test('severe incidents cost more than minor ones', () => {
  const severe = safetyScore([at(1, 'harassment')], NOW);
  const minor = safetyScore([at(1, 'poor_lighting')], NOW);
  assert.equal(severe, 91);
  assert.equal(minor, 97);
  assert.ok(severe < minor);
});

test('score keeps discriminating at volume instead of pinning to a floor', () => {
  const fifty = safetyScore(Array.from({ length: 50 }, (_, i) => at(1, i % 2 ? 'harassment' : 'theft')), NOW);
  const twoHundred = safetyScore(Array.from({ length: 200 }, () => at(1, 'harassment')), NOW);
  assert.equal(fifty, 23);
  assert.ok(twoHundred < fifty && twoHundred > 0);
});

test('reports older than 30 days are ignored, pending timestamps count', () => {
  assert.equal(safetyScore([at(31, 'harassment'), at(45, 'stalking')], NOW), 100);
  assert.equal(safetyScore([at(29, 'harassment')], NOW), 91);
  assert.equal(safetyScore([{ type: 'harassment', createdAt: null }], NOW), 91);
  assert.equal(safetyScore([{ type: 'harassment' }], NOW), 91);
});

test('report lifecycle starts pending and ends closed', () => {
  assert.equal(REPORT_STATUSES[0], 'pending');
  assert.equal(REPORT_STATUSES.at(-1), 'closed');
  assert.equal(new Set(REPORT_STATUSES).size, REPORT_STATUSES.length);
});
