import type { GradeLetter } from './types';

export const GRADE_POINTS: Record<GradeLetter, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  RA: 0,
};

export interface BunkPlan {
  percentage: number;
  status: 'safe' | 'borderline' | 'shortage';
  safeBunks: number;
  classesNeeded: number;
}

/**
 * Computes attendance percentage, safe bunk margin, or consecutive recovery classes
 * needed to reach a target attendance percentage (e.g., 75%).
 */
export function calculateBunkPlan(
  attended: number,
  conducted: number,
  targetPct = 75
): BunkPlan {
  const safeAttended = Math.max(0, Math.floor(attended));
  const safeConducted = Math.max(safeAttended, Math.floor(conducted));
  const clampedTarget = Math.min(99, Math.max(1, targetPct));

  if (safeConducted === 0) {
    return {
      percentage: 100,
      status: 'safe',
      safeBunks: 0,
      classesNeeded: 0,
    };
  }

  const percentage = Number(((safeAttended / safeConducted) * 100).toFixed(1));
  const ratio = clampedTarget / 100;

  let safeBunks = 0;
  let classesNeeded = 0;

  if (safeAttended / safeConducted >= ratio) {
    // Maximum additional missed classes b such that attended / (conducted + b) >= ratio
    safeBunks = Math.max(0, Math.floor(safeAttended / ratio - safeConducted));
  } else {
    // Minimum consecutive classes n to attend such that (attended + n) / (conducted + n) >= ratio
    classesNeeded = Math.max(
      0,
      Math.ceil((ratio * safeConducted - safeAttended) / (1 - ratio))
    );
  }

  const status: BunkPlan['status'] =
    percentage >= clampedTarget + 5
      ? 'safe'
      : percentage >= clampedTarget
        ? 'borderline'
        : 'shortage';

  return {
    percentage,
    status,
    safeBunks,
    classesNeeded,
  };
}

/**
 * Simulates attendance after attending `attendNext` and skipping `skipNext` upcoming classes.
 */
export function simulateAttendance(
  attended: number,
  conducted: number,
  attendNext: number,
  skipNext: number,
  targetPct = 75
): BunkPlan {
  const nextAttended = Math.max(0, attended + Math.max(0, attendNext));
  const nextConducted = Math.max(
    nextAttended,
    conducted + Math.max(0, attendNext) + Math.max(0, skipNext)
  );
  return calculateBunkPlan(nextAttended, nextConducted, targetPct);
}

export interface PlannedCourse {
  code: string;
  name: string;
  credits: number;
  grade: GradeLetter;
}

export function calculateSemesterSgpa(courses: PlannedCourse[]): {
  sgpa: number;
  totalCredits: number;
} {
  let weightedPoints = 0;
  let totalCredits = 0;
  for (const course of courses) {
    if (course.credits <= 0) continue;
    weightedPoints += course.credits * GRADE_POINTS[course.grade];
    totalCredits += course.credits;
  }
  if (totalCredits === 0) return { sgpa: 0, totalCredits: 0 };
  return {
    sgpa: Number((weightedPoints / totalCredits).toFixed(2)),
    totalCredits,
  };
}

export interface TargetCgpaPlan {
  requiredSgpa: number;
  achievable: boolean;
  maxPossibleCgpa: number;
}

export function calculateRequiredSgpa(
  currentCgpa: number,
  completedCredits: number,
  targetCgpa: number,
  remainingCredits: number
): TargetCgpaPlan {
  const safeCompleted = Math.max(0, completedCredits);
  const safeRemaining = Math.max(1, remainingCredits);
  const totalCredits = safeCompleted + safeRemaining;
  const requiredPoints = targetCgpa * totalCredits - currentCgpa * safeCompleted;
  const requiredSgpa = Number((requiredPoints / safeRemaining).toFixed(2));
  const maxPossibleCgpa = Number(
    ((currentCgpa * safeCompleted + 10 * safeRemaining) / totalCredits).toFixed(2)
  );

  return {
    requiredSgpa: Math.max(0, requiredSgpa),
    achievable: requiredSgpa <= 10,
    maxPossibleCgpa,
  };
}

export function projectCgpa(
  currentCgpa: number,
  completedCredits: number,
  plannedSgpa: number,
  plannedCredits: number
): number {
  const totalCredits = Math.max(0, completedCredits) + Math.max(0, plannedCredits);
  if (totalCredits === 0) return 0;
  const weighted =
    currentCgpa * Math.max(0, completedCredits) +
    plannedSgpa * Math.max(0, plannedCredits);
  return Number((weighted / totalCredits).toFixed(2));
}
