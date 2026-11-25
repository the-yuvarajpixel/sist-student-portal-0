export type DataSourceMode = 'mock' | 'live';

export interface HealthCheckItem {
  id: string;
  label: string;
  status: 'ok' | 'warning' | 'error';
  summary: string;
  action?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded';
  mode: DataSourceMode;
  checkedAt: string;
  deep: boolean;
  erpOutageSimulated: boolean;
  checks: HealthCheckItem[];
}

export interface SectionEnvelope<T> {
  data: T;
  stale: boolean;
  fetchedAt: string;
  source: 'ERP' | 'LMS' | 'ERP + LMS';
  mode: DataSourceMode;
  warning?: string;
}

export interface PublicUser {
  registerNumber: string;
  name: string;
  mode: DataSourceMode;
  signedInAt: string;
}

export interface StudentProfile {
  registerNumber: string;
  name: string;
  department: string;
  programme: string;
  semester: number;
  batch: string;
  section: string;
  mentor: string;
  email: string;
  cgpa: number;
  creditsEarned: number;
  creditsTotal: number;
}

export interface CourseAttendance {
  code: string;
  name: string;
  faculty: string;
  attended: number;
  conducted: number;
  credits: number;
  category: 'Theory' | 'Lab' | 'Project';
  lastUpdated: string;
}

export interface AttendanceData {
  overallPercentage: number;
  totalAttended: number;
  totalConducted: number;
  targetPercentage: number;
  courses: CourseAttendance[];
}

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export interface TimetableSlot {
  id: string;
  day: Weekday;
  startTime: string;
  endTime: string;
  code: string;
  courseName: string;
  room: string;
  faculty: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
}

export interface TimetableData {
  semester: string;
  effectiveFrom: string;
  slots: TimetableSlot[];
}

export type GradeLetter = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'RA';

export interface SubjectResult {
  code: string;
  name: string;
  credits: number;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: GradeLetter;
  gradePoint: number;
  status: 'Pass' | 'Arrear';
}

export interface SemesterResult {
  semester: number;
  term: string;
  sgpa: number;
  credits: number;
  subjects: SubjectResult[];
}

export interface ResultsData {
  cgpa: number;
  totalCredits: number;
  activeArrears: number;
  semesters: SemesterResult[];
}

export interface DeadlineItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  source: 'ERP' | 'LMS';
  type: 'Assignment' | 'Lab Record' | 'Quiz' | 'Exam' | 'Fee';
  dueAt: string;
  status: 'pending' | 'submitted' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  source: 'ERP' | 'LMS';
  category: 'Academic' | 'Exam' | 'Attendance' | 'LMS' | 'Campus';
  createdAt: string;
  read: boolean;
  actionLabel?: string;
}
