import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBunkPlan,
  calculateRequiredSgpa,
  calculateSemesterSgpa,
  projectCgpa,
  simulateAttendance,
} from './academics';
import { TwoTierCache } from './cache';
import {
  validateAttendance,
  validateDeadlines,
  validateNotifications,
  validateProfile,
  validateResults,
  validateTimetable,
} from './schemas';
import {
  buildMockAttendance,
  buildMockDeadlines,
  buildMockNotifications,
  buildMockProfile,
  buildMockResults,
  buildMockTimetable,
} from '../server/mockData';

test('calculateBunkPlan computes safe bunks when above target', () => {
  const plan = calculateBunkPlan(34, 40, 75);
  assert.equal(plan.percentage, 85);
  assert.equal(plan.status, 'safe');
  assert.equal(plan.safeBunks, 5);
  assert.equal(plan.classesNeeded, 0);
});

test('calculateBunkPlan computes consecutive classes needed when below target', () => {
  const plan = calculateBunkPlan(27, 38, 75);
  assert.equal(plan.percentage, 71.1);
  assert.equal(plan.status, 'shortage');
  assert.equal(plan.safeBunks, 0);
  assert.equal(plan.classesNeeded, 6);
  const afterRecovery = simulateAttendance(27, 38, 6, 0, 75);
  assert.ok(afterRecovery.percentage >= 75);
});

test('CGPA planner computes semester SGPA and required target SGPA', () => {
  const { sgpa, totalCredits } = calculateSemesterSgpa([
    { code: 'A', name: 'Course A', credits: 4, grade: 'O' },
    { code: 'B', name: 'Course B', credits: 4, grade: 'A' },
  ]);
  assert.equal(sgpa, 9);
  assert.equal(totalCredits, 8);

  const plan = calculateRequiredSgpa(8.5, 80, 8.75, 20);
  assert.equal(plan.requiredSgpa, 9.75);
  assert.equal(plan.achievable, true);

  const projected = projectCgpa(8.5, 80, 9.5, 20);
  assert.equal(projected, 8.7);
});

test('TwoTierCache serves fresh cache and falls back stale-while-error on failure', async () => {
  const cache = new TwoTierCache();
  const userHash = TwoTierCache.hashUserKey('42110482');
  let calls = 0;

  const first = await cache.getOrFetch(userHash, 'attendance', 60_000, async () => {
    calls += 1;
    return { value: 85 };
  });
  assert.equal(first.stale, false);
  assert.equal(first.data.value, 85);
  assert.equal(calls, 1);

  const second = await cache.getOrFetch(userHash, 'attendance', 60_000, async () => {
    calls += 1;
    return { value: 99 };
  });
  assert.equal(second.data.value, 85);
  assert.equal(calls, 1);

  const staleFallback = await cache.getOrFetch<{ value: number }>(
    userHash,
    'attendance',
    60_000,
    async () => {
      throw new Error('ERP timeout');
    },
    { forceRefresh: true }
  );
  assert.equal(staleFallback.stale, true);
  assert.equal(staleFallback.data.value, 85);
  assert.match(staleFallback.warning ?? '', /ERP timeout/);

  cache.clearUser(userHash);
  assert.equal(cache.stats().entries, 0);
});

test('All mock builders satisfy their runtime schema validators', () => {
  assert.ok(validateProfile(buildMockProfile('42110482')).registerNumber === '42110482');
  assert.ok(validateAttendance(buildMockAttendance()).courses.length > 0);
  assert.ok(validateTimetable(buildMockTimetable()).slots.length > 0);
  assert.ok(validateResults(buildMockResults()).semesters.length > 0);
  assert.ok(validateDeadlines(buildMockDeadlines().items).length > 0);
  assert.ok(validateNotifications(buildMockNotifications()).length > 0);
});
