import type {
  AttendanceData,
  CourseAttendance,
  DeadlineItem,
  GradeLetter,
  NotificationItem,
  ResultsData,
  SemesterResult,
  StudentProfile,
  SubjectResult,
  TimetableData,
  TimetableSlot,
  Weekday,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid string field: ${field}`);
  }
  return value.trim();
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric field: ${field}`);
  }
  return value;
}

function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid boolean field: ${field}`);
  }
  return value;
}

const VALID_WEEKDAYS = new Set<Weekday>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
const VALID_GRADES = new Set<GradeLetter>(['O', 'A+', 'A', 'B+', 'B', 'C', 'RA']);

export function validateProfile(raw: unknown): StudentProfile {
  if (!isRecord(raw)) throw new Error('Profile payload must be an object');
  return {
    registerNumber: asString(raw.registerNumber, 'registerNumber'),
    name: asString(raw.name, 'name'),
    department: asString(raw.department, 'department'),
    programme: asString(raw.programme, 'programme'),
    semester: asNumber(raw.semester, 'semester'),
    batch: asString(raw.batch, 'batch'),
    section: asString(raw.section, 'section'),
    mentor: asString(raw.mentor, 'mentor'),
    email: asString(raw.email, 'email'),
    cgpa: asNumber(raw.cgpa, 'cgpa'),
    creditsEarned: asNumber(raw.creditsEarned, 'creditsEarned'),
    creditsTotal: asNumber(raw.creditsTotal, 'creditsTotal'),
  };
}

export function validateAttendance(raw: unknown): AttendanceData {
  if (!isRecord(raw) || !Array.isArray(raw.courses)) {
    throw new Error('Attendance payload must contain courses array');
  }
  const courses: CourseAttendance[] = raw.courses.map((item, idx) => {
    if (!isRecord(item)) throw new Error(`Invalid course at index ${idx}`);
    const category = item.category;
    if (category !== 'Theory' && category !== 'Lab' && category !== 'Project') {
      throw new Error(`Invalid course category at index ${idx}`);
    }
    return {
      code: asString(item.code, `courses[${idx}].code`),
      name: asString(item.name, `courses[${idx}].name`),
      faculty: asString(item.faculty, `courses[${idx}].faculty`),
      attended: asNumber(item.attended, `courses[${idx}].attended`),
      conducted: asNumber(item.conducted, `courses[${idx}].conducted`),
      credits: asNumber(item.credits, `courses[${idx}].credits`),
      category,
      lastUpdated: asString(item.lastUpdated, `courses[${idx}].lastUpdated`),
    };
  });

  return {
    overallPercentage: asNumber(raw.overallPercentage, 'overallPercentage'),
    totalAttended: asNumber(raw.totalAttended, 'totalAttended'),
    totalConducted: asNumber(raw.totalConducted, 'totalConducted'),
    targetPercentage: asNumber(raw.targetPercentage, 'targetPercentage'),
    courses,
  };
}

export function validateTimetable(raw: unknown): TimetableData {
  if (!isRecord(raw) || !Array.isArray(raw.slots)) {
    throw new Error('Timetable payload must contain slots array');
  }
  const slots: TimetableSlot[] = raw.slots.map((item, idx) => {
    if (!isRecord(item)) throw new Error(`Invalid slot at index ${idx}`);
    const day = item.day as Weekday;
    if (!VALID_WEEKDAYS.has(day)) throw new Error(`Invalid weekday at index ${idx}`);
    const type = item.type;
    if (type !== 'Lecture' && type !== 'Lab' && type !== 'Tutorial') {
      throw new Error(`Invalid slot type at index ${idx}`);
    }
    return {
      id: asString(item.id, `slots[${idx}].id`),
      day,
      startTime: asString(item.startTime, `slots[${idx}].startTime`),
      endTime: asString(item.endTime, `slots[${idx}].endTime`),
      code: asString(item.code, `slots[${idx}].code`),
      courseName: asString(item.courseName, `slots[${idx}].courseName`),
      room: asString(item.room, `slots[${idx}].room`),
      faculty: asString(item.faculty, `slots[${idx}].faculty`),
      type,
    };
  });

  return {
    semester: asString(raw.semester, 'semester'),
    effectiveFrom: asString(raw.effectiveFrom, 'effectiveFrom'),
    slots,
  };
}

export function validateResults(raw: unknown): ResultsData {
  if (!isRecord(raw) || !Array.isArray(raw.semesters)) {
    throw new Error('Results payload must contain semesters array');
  }

  const semesters: SemesterResult[] = raw.semesters.map((sem, sIdx) => {
    if (!isRecord(sem) || !Array.isArray(sem.subjects)) {
      throw new Error(`Invalid semester at index ${sIdx}`);
    }
    const subjects: SubjectResult[] = sem.subjects.map((sub, subIdx) => {
      if (!isRecord(sub)) throw new Error(`Invalid subject at ${sIdx}.${subIdx}`);
      const grade = sub.grade as GradeLetter;
      if (!VALID_GRADES.has(grade)) {
        throw new Error(`Invalid grade at ${sIdx}.${subIdx}`);
      }
      const status = sub.status;
      if (status !== 'Pass' && status !== 'Arrear') {
        throw new Error(`Invalid subject status at ${sIdx}.${subIdx}`);
      }
      return {
        code: asString(sub.code, `semesters[${sIdx}].subjects[${subIdx}].code`),
        name: asString(sub.name, `semesters[${sIdx}].subjects[${subIdx}].name`),
        credits: asNumber(sub.credits, `semesters[${sIdx}].subjects[${subIdx}].credits`),
        internalMarks: asNumber(
          sub.internalMarks,
          `semesters[${sIdx}].subjects[${subIdx}].internalMarks`
        ),
        externalMarks: asNumber(
          sub.externalMarks,
          `semesters[${sIdx}].subjects[${subIdx}].externalMarks`
        ),
        totalMarks: asNumber(
          sub.totalMarks,
          `semesters[${sIdx}].subjects[${subIdx}].totalMarks`
        ),
        grade,
        gradePoint: asNumber(
          sub.gradePoint,
          `semesters[${sIdx}].subjects[${subIdx}].gradePoint`
        ),
        status,
      };
    });

    return {
      semester: asNumber(sem.semester, `semesters[${sIdx}].semester`),
      term: asString(sem.term, `semesters[${sIdx}].term`),
      sgpa: asNumber(sem.sgpa, `semesters[${sIdx}].sgpa`),
      credits: asNumber(sem.credits, `semesters[${sIdx}].credits`),
      subjects,
    };
  });

  return {
    cgpa: asNumber(raw.cgpa, 'cgpa'),
    totalCredits: asNumber(raw.totalCredits, 'totalCredits'),
    activeArrears: asNumber(raw.activeArrears, 'activeArrears'),
    semesters,
  };
}

export function validateDeadlines(raw: unknown): DeadlineItem[] {
  if (!Array.isArray(raw)) throw new Error('Deadlines payload must be an array');
  return raw.map((item, idx) => {
    if (!isRecord(item)) throw new Error(`Invalid deadline at index ${idx}`);
    const source = item.source;
    if (source !== 'ERP' && source !== 'LMS') {
      throw new Error(`Invalid deadline source at index ${idx}`);
    }
    const type = item.type;
    if (
      type !== 'Assignment' &&
      type !== 'Lab Record' &&
      type !== 'Quiz' &&
      type !== 'Exam' &&
      type !== 'Fee'
    ) {
      throw new Error(`Invalid deadline type at index ${idx}`);
    }
    const status = item.status;
    if (status !== 'pending' && status !== 'submitted' && status !== 'overdue') {
      throw new Error(`Invalid deadline status at index ${idx}`);
    }
    const priority = item.priority;
    if (priority !== 'high' && priority !== 'medium' && priority !== 'low') {
      throw new Error(`Invalid deadline priority at index ${idx}`);
    }
    return {
      id: asString(item.id, `deadlines[${idx}].id`),
      title: asString(item.title, `deadlines[${idx}].title`),
      courseCode: asString(item.courseCode, `deadlines[${idx}].courseCode`),
      courseName: asString(item.courseName, `deadlines[${idx}].courseName`),
      source,
      type,
      dueAt: asString(item.dueAt, `deadlines[${idx}].dueAt`),
      status,
      priority,
      description: asString(item.description, `deadlines[${idx}].description`),
    };
  });
}

export function validateNotifications(raw: unknown): NotificationItem[] {
  if (!Array.isArray(raw)) throw new Error('Notifications payload must be an array');
  return raw.map((item, idx) => {
    if (!isRecord(item)) throw new Error(`Invalid notification at index ${idx}`);
    const source = item.source;
    if (source !== 'ERP' && source !== 'LMS') {
      throw new Error(`Invalid notification source at index ${idx}`);
    }
    const category = item.category;
    if (
      category !== 'Academic' &&
      category !== 'Exam' &&
      category !== 'Attendance' &&
      category !== 'LMS' &&
      category !== 'Campus'
    ) {
      throw new Error(`Invalid notification category at index ${idx}`);
    }
    return {
      id: asString(item.id, `notifications[${idx}].id`),
      title: asString(item.title, `notifications[${idx}].title`),
      body: asString(item.body, `notifications[${idx}].body`),
      source,
      category,
      createdAt: asString(item.createdAt, `notifications[${idx}].createdAt`),
      read: asBoolean(item.read, `notifications[${idx}].read`),
      actionLabel:
        typeof item.actionLabel === 'string' && item.actionLabel.trim()
          ? item.actionLabel.trim()
          : undefined,
    };
  });
}
