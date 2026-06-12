import type {
  User,
  Course,
  Assignment,
  Submission,
  AttendanceRecord,
  Notification,
  CourseMessage,
  LiveSession,
  CourseResource,
} from "../types";

export const initialUsers: User[] = [
  { name: "Alex Morgan", email: "student@campus.edu", role: "Student", status: "Active" },
  { name: "Ms. Rivera", email: "rivera@campus.edu", role: "Teacher", status: "Active" },
  { name: "Mr. Chen", email: "chen@campus.edu", role: "Teacher", status: "Active" },
  { name: "Taylor Brooks", email: "admin@campus.edu", role: "Admin", status: "Active" },
];

export const initialCourses: Course[] = [
  {
    id: 1,
    title: "Digital Circuits 101",
    description: "Logic gates, truth tables, and simple circuit design.",
    teacher: "Ms. Rivera",
    meetingLink: "https://meet.google.com/circuits-101",
    enrolled: ["student@campus.edu"],
  },
  {
    id: 2,
    title: "Embedded Systems Lab",
    description: "Hands-on Arduino and sensor projects for beginners.",
    teacher: "Mr. Chen",
    meetingLink: "https://zoom.us/j/embedded-lab",
    enrolled: [],
  },
  {
    id: 3,
    title: "PCB Design Studio",
    description: "Design, review, and prepare boards for fabrication.",
    teacher: "Ms. Rivera",
    meetingLink: "https://meet.google.com/pcb-studio",
    enrolled: ["student@campus.edu"],
  },
];

export const initialAssignments: Assignment[] = [
  {
    id: 1,
    courseId: 1,
    title: "Truth Table Workbook",
    dueDate: "2026-05-28",
    instructions: "Upload answers for the seven gate combinations.",
  },
  {
    id: 2,
    courseId: 3,
    title: "First PCB Sketch",
    dueDate: "2026-06-03",
    instructions: "Submit a short note describing your board layout.",
  },
];

export const initialSubmissions: Submission[] = [
  {
    id: 1,
    assignmentId: 1,
    student: "student@campus.edu",
    response: "Completed workbook with NAND and NOR examples.",
    status: "Reviewed",
    attachment: {
      name: "truth-table-workbook.pdf",
      size: 248832,
      type: "application/pdf",
      uploadedAt: "2026-05-20",
    },
    grade: "92%",
    feedback: "Clear work. Recheck the final XOR row.",
  },
];

export const initialAttendanceRecords: AttendanceRecord[] = [
  { id: 1, courseId: 1, student: "student@campus.edu", date: "2026-05-20", status: "Present" },
  { id: 2, courseId: 3, student: "student@campus.edu", date: "2026-05-19", status: "Absent" },
];

export const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Assignment reviewed",
    message: "Truth Table Workbook has feedback and a posted grade.",
    audience: "Student",
    createdAt: "2026-05-20",
    readBy: [],
  },
  {
    id: 2,
    title: "Class link ready",
    message: "Digital Circuits 101 has a Google Meet link available.",
    audience: "Student",
    createdAt: "2026-05-20",
    readBy: [],
  },
  {
    id: 3,
    title: "Portal activity",
    message: "Course and submission activity is ready for admin review.",
    audience: "Admin",
    createdAt: "2026-05-20",
    readBy: [],
  },
];

export const initialMessages: CourseMessage[] = [
  {
    id: 1,
    courseId: 1,
    sender: "Ms. Rivera",
    senderRole: "Teacher",
    body: "Remember to bring your truth table notes to the next class.",
    createdAt: "2026-05-20",
  },
  {
    id: 2,
    courseId: 1,
    sender: "student@campus.edu",
    senderRole: "Student",
    body: "Can I submit the workbook as a PDF?",
    createdAt: "2026-05-20",
  },
];

export const initialLiveSessions: LiveSession[] = [
  {
    id: 1,
    courseId: 1,
    title: "Logic Gates Review",
    startsAt: "2026-05-22T10:00",
    link: "https://meet.google.com/circuits-101",
  },
  {
    id: 2,
    courseId: 3,
    title: "PCB Layout Critique",
    startsAt: "2026-05-24T14:30",
    link: "https://meet.google.com/pcb-studio",
  },
];

export const initialCourseResources: CourseResource[] = [
  {
    id: 1,
    courseId: 1,
    title: "Logic Gates Reference",
    description: "A quick sheet for AND, OR, NOT, NAND, NOR, and XOR gates.",
    attachment: {
      name: "logic-gates-reference.pdf",
      size: 184320,
      type: "application/pdf",
      uploadedAt: "2026-05-20",
    },
  },
  {
    id: 2,
    courseId: 3,
    title: "PCB Checklist",
    description: "Checklist for trace spacing, labels, and export settings.",
    attachment: {
      name: "pcb-review-checklist.pdf",
      size: 156672,
      type: "application/pdf",
      uploadedAt: "2026-05-20",
    },
  },
];