import type {
  AttendanceData,
  CourseAttendance,
  DeadlineItem,
  NotificationItem,
  ResultsData,
  StudentProfile,
  TimetableData,
} from '../core/types';

function daysFromNow(days: number, hour = 17, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const SAMPLE_NAMES = [
  'Karthik Subramanian',
  'Ananya Krishnan',
  'Pranav Natarajan',
  'Divya Chandrasekhar',
  'Rohan Venkatesh',
];

function pickDeterministicName(registerNumber: string): string {
  let sum = 0;
  for (let i = 0; i < registerNumber.length; i += 1) {
    sum += registerNumber.charCodeAt(i);
  }
  return SAMPLE_NAMES[sum % SAMPLE_NAMES.length] ?? 'Karthik Subramanian';
}

export function buildMockProfile(registerNumber: string, displayName?: string): StudentProfile {
  const cleanReg = registerNumber.toUpperCase();
  const resolvedName = displayName?.trim() || pickDeterministicName(cleanReg);
  const emailSlug = resolvedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return {
    registerNumber: cleanReg,
    name: resolvedName,
    department: 'Computer Science and Engineering',
    programme: 'B.E. Computer Science & Engineering',
    semester: 5,
    batch: '2023–2027',
    section: 'CSE-B2',
    mentor: 'Dr. S. Revathi, Associate Professor',
    email: `${emailSlug || cleanReg.toLowerCase()}@sathyabama.sample`,
    cgpa: 8.64,
    creditsEarned: 92,
    creditsTotal: 160,
  };
}

export function buildMockAttendance(): AttendanceData {
  const updated = hoursAgo(2);
  const courses: CourseAttendance[] = [
    {
      code: 'SCSA1501',
      name: 'Operating Systems',
      faculty: 'Dr. M. Vigneshwaran',
      attended: 34,
      conducted: 40,
      credits: 4,
      category: 'Theory',
      lastUpdated: updated,
    },
    {
      code: 'SCSA1502',
      name: 'Computer Networks',
      faculty: 'Prof. R. Meenakshi',
      attended: 27,
      conducted: 38,
      credits: 4,
      category: 'Theory',
      lastUpdated: updated,
    },
    {
      code: 'SCSA1503',
      name: 'Database Management Systems',
      faculty: 'Dr. K. Ashok Kumar',
      attended: 36,
      conducted: 41,
      credits: 4,
      category: 'Theory',
      lastUpdated: updated,
    },
    {
      code: 'SCSA1504',
      name: 'Compiler Design',
      faculty: 'Prof. P. Deepika',
      attended: 29,
      conducted: 37,
      credits: 3,
      category: 'Theory',
      lastUpdated: updated,
    },
    {
      code: 'SITA1505',
      name: 'Machine Learning Essentials',
      faculty: 'Dr. A. Lakshmanan',
      attended: 31,
      conducted: 35,
      credits: 3,
      category: 'Theory',
      lastUpdated: updated,
    },
    {
      code: 'SCSA2501',
      name: 'Operating Systems Lab',
      faculty: 'Dr. M. Vigneshwaran',
      attended: 17,
      conducted: 18,
      credits: 2,
      category: 'Lab',
      lastUpdated: updated,
    },
    {
      code: 'SCSA2502',
      name: 'Computer Networks Lab',
      faculty: 'Prof. R. Meenakshi',
      attended: 14,
      conducted: 18,
      credits: 2,
      category: 'Lab',
      lastUpdated: updated,
    },
  ];

  const totalAttended = courses.reduce((sum, c) => sum + c.attended, 0);
  const totalConducted = courses.reduce((sum, c) => sum + c.conducted, 0);
  const overallPercentage = Number(((totalAttended / totalConducted) * 100).toFixed(1));

  return {
    overallPercentage,
    totalAttended,
    totalConducted,
    targetPercentage: 75,
    courses,
  };
}

export function buildMockTimetable(): TimetableData {
  return {
    semester: 'Semester V (Odd 2026)',
    effectiveFrom: daysFromNow(-45, 9, 0),
    slots: [
      // Monday
      {
        id: 'mon-1',
        day: 'Mon',
        startTime: '08:30',
        endTime: '09:20',
        code: 'SCSA1501',
        courseName: 'Operating Systems',
        room: 'Block 14 · Rm 302',
        faculty: 'Dr. M. Vigneshwaran',
        type: 'Lecture',
      },
      {
        id: 'mon-2',
        day: 'Mon',
        startTime: '09:30',
        endTime: '10:20',
        code: 'SCSA1502',
        courseName: 'Computer Networks',
        room: 'Block 14 · Rm 302',
        faculty: 'Prof. R. Meenakshi',
        type: 'Lecture',
      },
      {
        id: 'mon-3',
        day: 'Mon',
        startTime: '10:40',
        endTime: '12:20',
        code: 'SCSA2501',
        courseName: 'Operating Systems Lab',
        room: 'CSE Lab 3 · Ground',
        faculty: 'Dr. M. Vigneshwaran',
        type: 'Lab',
      },
      {
        id: 'mon-4',
        day: 'Mon',
        startTime: '13:30',
        endTime: '14:20',
        code: 'SITA1505',
        courseName: 'Machine Learning Essentials',
        room: 'Block 14 · Rm 214',
        faculty: 'Dr. A. Lakshmanan',
        type: 'Lecture',
      },
      // Tuesday
      {
        id: 'tue-1',
        day: 'Tue',
        startTime: '08:30',
        endTime: '09:20',
        code: 'SCSA1503',
        courseName: 'Database Management Systems',
        room: 'Block 14 · Rm 305',
        faculty: 'Dr. K. Ashok Kumar',
        type: 'Lecture',
      },
      {
        id: 'tue-2',
        day: 'Tue',
        startTime: '09:30',
        endTime: '10:20',
        code: 'SCSA1504',
        courseName: 'Compiler Design',
        room: 'Block 14 · Rm 305',
        faculty: 'Prof. P. Deepika',
        type: 'Lecture',
      },
      {
        id: 'tue-3',
        day: 'Tue',
        startTime: '10:40',
        endTime: '11:30',
        code: 'SCSA1501',
        courseName: 'Operating Systems',
        room: 'Block 14 · Rm 302',
        faculty: 'Dr. M. Vigneshwaran',
        type: 'Tutorial',
      },
      {
        id: 'tue-4',
        day: 'Tue',
        startTime: '13:30',
        endTime: '15:10',
        code: 'SCSA2502',
        courseName: 'Computer Networks Lab',
        room: 'Networking Lab · Block 12',
        faculty: 'Prof. R. Meenakshi',
        type: 'Lab',
      },
      // Wednesday
      {
        id: 'wed-1',
        day: 'Wed',
        startTime: '08:30',
        endTime: '09:20',
        code: 'SCSA1502',
        courseName: 'Computer Networks',
        room: 'Block 14 · Rm 302',
        faculty: 'Prof. R. Meenakshi',
        type: 'Lecture',
      },
      {
        id: 'wed-2',
        day: 'Wed',
        startTime: '09:30',
        endTime: '10:20',
        code: 'SITA1505',
        courseName: 'Machine Learning Essentials',
        room: 'Block 14 · Rm 214',
        faculty: 'Dr. A. Lakshmanan',
        type: 'Lecture',
      },
      {
        id: 'wed-3',
        day: 'Wed',
        startTime: '10:40',
        endTime: '11:30',
        code: 'SCSA1503',
        courseName: 'Database Management Systems',
        room: 'Block 14 · Rm 305',
        faculty: 'Dr. K. Ashok Kumar',
        type: 'Lecture',
      },
      {
        id: 'wed-4',
        day: 'Wed',
        startTime: '11:40',
        endTime: '12:30',
        code: 'SCSA1504',
        courseName: 'Compiler Design',
        room: 'Block 14 · Rm 305',
        faculty: 'Prof. P. Deepika',
        type: 'Tutorial',
      },
      // Thursday
      {
        id: 'thu-1',
        day: 'Thu',
        startTime: '08:30',
        endTime: '09:20',
        code: 'SCSA1504',
        courseName: 'Compiler Design',
        room: 'Block 14 · Rm 305',
        faculty: 'Prof. P. Deepika',
        type: 'Lecture',
      },
      {
        id: 'thu-2',
        day: 'Thu',
        startTime: '09:30',
        endTime: '10:20',
        code: 'SCSA1501',
        courseName: 'Operating Systems',
        room: 'Block 14 · Rm 302',
        faculty: 'Dr. M. Vigneshwaran',
        type: 'Lecture',
      },
      {
        id: 'thu-3',
        day: 'Thu',
        startTime: '10:40',
        endTime: '11:30',
        code: 'SCSA1502',
        courseName: 'Computer Networks',
        room: 'Block 14 · Rm 302',
        faculty: 'Prof. R. Meenakshi',
        type: 'Tutorial',
      },
      {
        id: 'thu-4',
        day: 'Thu',
        startTime: '13:30',
        endTime: '14:20',
        code: 'SCSA1503',
        courseName: 'Database Management Systems',
        room: 'Block 14 · Rm 305',
        faculty: 'Dr. K. Ashok Kumar',
        type: 'Lecture',
      },
      // Friday
      {
        id: 'fri-1',
        day: 'Fri',
        startTime: '08:30',
        endTime: '09:20',
        code: 'SITA1505',
        courseName: 'Machine Learning Essentials',
        room: 'Block 14 · Rm 214',
        faculty: 'Dr. A. Lakshmanan',
        type: 'Lecture',
      },
      {
        id: 'fri-2',
        day: 'Fri',
        startTime: '09:30',
        endTime: '10:20',
        code: 'SCSA1503',
        courseName: 'Database Management Systems',
        room: 'Block 14 · Rm 305',
        faculty: 'Dr. K. Ashok Kumar',
        type: 'Tutorial',
      },
      {
        id: 'fri-3',
        day: 'Fri',
        startTime: '10:40',
        endTime: '11:30',
        code: 'SCSA1501',
        courseName: 'Operating Systems',
        room: 'Block 14 · Rm 302',
        faculty: 'Dr. M. Vigneshwaran',
        type: 'Lecture',
      },
      {
        id: 'fri-4',
        day: 'Fri',
        startTime: '11:40',
        endTime: '12:30',
        code: 'SCSA1504',
        courseName: 'Compiler Design',
        room: 'Block 14 · Rm 305',
        faculty: 'Prof. P. Deepika',
        type: 'Lecture',
      },
    ],
  };
}

export function buildMockResults(): ResultsData {
  const semesters = [
    {
      semester: 1,
      term: 'Odd 2023',
      sgpa: 8.32,
      credits: 22,
      subjects: [
        { code: 'SMTA1101', name: 'Engineering Mathematics I', credits: 4, internalMarks: 42, externalMarks: 44, totalMarks: 86, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SPHA1101', name: 'Physics for Information Science', credits: 4, internalMarks: 40, externalMarks: 39, totalMarks: 79, grade: 'A' as const, gradePoint: 8, status: 'Pass' as const },
        { code: 'SCSA1101', name: 'Programming in C', credits: 4, internalMarks: 45, externalMarks: 46, totalMarks: 91, grade: 'O' as const, gradePoint: 10, status: 'Pass' as const },
        { code: 'SEEA1101', name: 'Basic Electrical Engineering', credits: 4, internalMarks: 36, externalMarks: 37, totalMarks: 73, grade: 'B+' as const, gradePoint: 7, status: 'Pass' as const },
        { code: 'SHSA1101', name: 'Technical English', credits: 3, internalMarks: 41, externalMarks: 40, totalMarks: 81, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCSA2101', name: 'C Programming Lab', credits: 3, internalMarks: 44, externalMarks: 42, totalMarks: 86, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
      ],
    },
    {
      semester: 2,
      term: 'Even 2024',
      sgpa: 8.55,
      credits: 23,
      subjects: [
        { code: 'SMTA1201', name: 'Engineering Mathematics II', credits: 4, internalMarks: 41, externalMarks: 43, totalMarks: 84, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCSA1201', name: 'Data Structures', credits: 4, internalMarks: 46, externalMarks: 47, totalMarks: 93, grade: 'O' as const, gradePoint: 10, status: 'Pass' as const },
        { code: 'SCSA1202', name: 'Digital Logic Design', credits: 4, internalMarks: 39, externalMarks: 38, totalMarks: 77, grade: 'A' as const, gradePoint: 8, status: 'Pass' as const },
        { code: 'SCSA1203', name: 'Object Oriented Programming', credits: 4, internalMarks: 43, externalMarks: 44, totalMarks: 87, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCYA1201', name: 'Environmental Science', credits: 3, internalMarks: 38, externalMarks: 37, totalMarks: 75, grade: 'A' as const, gradePoint: 8, status: 'Pass' as const },
        { code: 'SCSA2201', name: 'Data Structures Lab', credits: 4, internalMarks: 44, externalMarks: 43, totalMarks: 87, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
      ],
    },
    {
      semester: 3,
      term: 'Odd 2024',
      sgpa: 8.78,
      credits: 23,
      subjects: [
        { code: 'SMTA1302', name: 'Discrete Mathematics', credits: 4, internalMarks: 43, externalMarks: 45, totalMarks: 88, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCSA1301', name: 'Design & Analysis of Algorithms', credits: 4, internalMarks: 46, externalMarks: 46, totalMarks: 92, grade: 'O' as const, gradePoint: 10, status: 'Pass' as const },
        { code: 'SCSA1302', name: 'Computer Organization', credits: 4, internalMarks: 40, externalMarks: 39, totalMarks: 79, grade: 'A' as const, gradePoint: 8, status: 'Pass' as const },
        { code: 'SCSA1303', name: 'Software Engineering', credits: 4, internalMarks: 42, externalMarks: 41, totalMarks: 83, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCSA1304', name: 'Java Programming', credits: 4, internalMarks: 44, externalMarks: 45, totalMarks: 89, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCSA2301', name: 'Algorithms Lab', credits: 3, internalMarks: 45, externalMarks: 44, totalMarks: 89, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
      ],
    },
    {
      semester: 4,
      term: 'Even 2025',
      sgpa: 8.88,
      credits: 24,
      subjects: [
        { code: 'SMTA1402', name: 'Probability & Queuing Theory', credits: 4, internalMarks: 43, externalMarks: 44, totalMarks: 87, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCSA1401', name: 'Theory of Computation', credits: 4, internalMarks: 41, externalMarks: 40, totalMarks: 81, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
        { code: 'SCSA1402', name: 'Microprocessors & Interfacing', credits: 4, internalMarks: 39, externalMarks: 40, totalMarks: 79, grade: 'A' as const, gradePoint: 8, status: 'Pass' as const },
        { code: 'SCSA1403', name: 'Web Technologies', credits: 4, internalMarks: 47, externalMarks: 46, totalMarks: 93, grade: 'O' as const, gradePoint: 10, status: 'Pass' as const },
        { code: 'SITA1404', name: 'Python for Data Science', credits: 4, internalMarks: 45, externalMarks: 46, totalMarks: 91, grade: 'O' as const, gradePoint: 10, status: 'Pass' as const },
        { code: 'SCSA2401', name: 'Web & Python Lab', credits: 4, internalMarks: 44, externalMarks: 43, totalMarks: 87, grade: 'A+' as const, gradePoint: 9, status: 'Pass' as const },
      ],
    },
  ];

  return {
    cgpa: 8.64,
    totalCredits: 92,
    activeArrears: 0,
    semesters,
  };
}

export function buildMockDeadlines(): { items: DeadlineItem[] } {
  const items: DeadlineItem[] = [
    {
      id: 'dl-1',
      title: 'TCP Congestion Control Wireshark Lab Record',
      courseCode: 'SCSA2502',
      courseName: 'Computer Networks Lab',
      source: 'LMS',
      type: 'Lab Record',
      dueAt: daysFromNow(1, 23, 55),
      status: 'pending',
      priority: 'high',
      description: 'Upload annotated PCAP analysis PDF and throughput plots to Moodle before midnight.',
    },
    {
      id: 'dl-2',
      title: 'Unit 3 Quiz: Deadlocks & Memory Paging',
      courseCode: 'SCSA1501',
      courseName: 'Operating Systems',
      source: 'LMS',
      type: 'Quiz',
      dueAt: daysFromNow(2, 18, 0),
      status: 'pending',
      priority: 'high',
      description: '25-minute timed Moodle quiz covering Banker’s algorithm, page replacement, and TLB hit ratios.',
    },
    {
      id: 'dl-3',
      title: 'CAE-2 Examination Registration Confirmation',
      courseCode: 'ERP-EXAM',
      courseName: 'Continuous Assessment Exam II',
      source: 'ERP',
      type: 'Exam',
      dueAt: daysFromNow(4, 16, 0),
      status: 'pending',
      priority: 'high',
      description: 'Verify subject codes and seating hall allocation on the college ERP examination portal.',
    },
    {
      id: 'dl-4',
      title: 'ER-to-Relational Normalization Case Study',
      courseCode: 'SCSA1503',
      courseName: 'Database Management Systems',
      source: 'LMS',
      type: 'Assignment',
      dueAt: daysFromNow(6, 23, 55),
      status: 'pending',
      priority: 'medium',
      description: 'Submit BCNF decomposition proof and PostgreSQL DDL script for the hospital schema.',
    },
    {
      id: 'dl-5',
      title: 'Regular Semester Examination Fee Window',
      courseCode: 'ERP-FIN',
      courseName: 'Accounts & Examination Cell',
      source: 'ERP',
      type: 'Fee',
      dueAt: daysFromNow(10, 17, 0),
      status: 'pending',
      priority: 'medium',
      description: 'Pay Semester V regular exam fee before late-fee surcharge begins.',
    },
    {
      id: 'dl-6',
      title: 'LL(1) Parser Table & First/Follow Worksheet',
      courseCode: 'SCSA1504',
      courseName: 'Compiler Design',
      source: 'LMS',
      type: 'Assignment',
      dueAt: daysFromNow(-1, 23, 55),
      status: 'overdue',
      priority: 'high',
      description: 'Grace upload window closes in 24 hours with a 10% late submission deduction.',
    },
    {
      id: 'dl-7',
      title: 'Supervised Regression Notebook (Scikit-Learn)',
      courseCode: 'SITA1505',
      courseName: 'Machine Learning Essentials',
      source: 'LMS',
      type: 'Assignment',
      dueAt: daysFromNow(-3, 23, 55),
      status: 'submitted',
      priority: 'low',
      description: 'Submitted on time — graded 19/20 by Dr. A. Lakshmanan.',
    },
  ];

  return { items };
}

export function buildMockNotifications(): NotificationItem[] {
  return [
    {
      id: 'ntf-1',
      title: 'Attendance threshold alert: Computer Networks (71.1%)',
      body: 'SCSA1502 is currently below the mandatory 75% requirement. Attend the next 6 consecutive sessions without absence to restore eligibility before CAE-2.',
      source: 'ERP',
      category: 'Attendance',
      createdAt: hoursAgo(2),
      read: false,
      actionLabel: 'Open Bunk Calculator',
    },
    {
      id: 'ntf-2',
      title: 'CAE-2 Timetable Published for Semester V',
      body: 'Continuous Assessment Exam II starts in 12 days. Morning slot exams run 09:00–10:30 in Block 14.',
      source: 'ERP',
      category: 'Exam',
      createdAt: hoursAgo(5),
      read: false,
      actionLabel: 'Review Deadlines',
    },
    {
      id: 'ntf-3',
      title: 'New Lecture Slides: Unit 4 Query Optimization',
      body: 'Dr. K. Ashok Kumar uploaded revised B+ Tree indexing notes and worked SQL execution plan problems on Moodle.',
      source: 'LMS',
      category: 'LMS',
      createdAt: hoursAgo(9),
      read: false,
    },
    {
      id: 'ntf-4',
      title: 'Operating Systems Lab Batch Swap Approved',
      body: 'Your request to attend Monday CSE Lab 3 with Batch B2 has been approved by the lab coordinator.',
      source: 'ERP',
      category: 'Academic',
      createdAt: hoursAgo(26),
      read: true,
    },
    {
      id: 'ntf-5',
      title: 'Moodle Graded: Supervised Regression Notebook (19/20)',
      body: 'Feedback from Dr. A. Lakshmanan: Strong cross-validation analysis and clean residual plots.',
      source: 'LMS',
      category: 'LMS',
      createdAt: hoursAgo(42),
      read: true,
    },
    {
      id: 'ntf-6',
      title: 'Central Library Extended Study Hours for Exams',
      body: 'Reading Hall Floors 1 and 2 will remain open until 22:00 on weekdays through the end of CAE-2.',
      source: 'ERP',
      category: 'Campus',
      createdAt: hoursAgo(68),
      read: true,
    },
  ];
}
