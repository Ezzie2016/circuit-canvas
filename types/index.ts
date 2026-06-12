export type Role = "Student" | "Teacher" | "Admin";
export type AuthMode = "login" | "register";
export type SubmissionStatus = "Submitted" | "Reviewed";
export type AttendanceStatus = "Present" | "Absent";

export type User = {
  name: string;
  email: string;
  role: Role;
  status?: "Active" | "Inactive";
};

export type Course = {
  id: number;
  title: string;
  description: string;
  teacher: string;
  meetingLink: string;
  enrolled: string[];
};

export type Assignment = {
  id: number;
  courseId: number;
  title: string;
  dueDate: string;
  instructions: string;
};

export type FileAttachment = {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

export type Submission = {
  id: number;
  assignmentId: number;
  student: string;
  response: string;
  status: SubmissionStatus;
  attachment?: FileAttachment;
  grade?: string;
  feedback?: string;
};

export type AttendanceRecord = {
  id: number;
  courseId: number;
  student: string;
  date: string;
  status: AttendanceStatus;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  audience: Role | "All";
  createdAt: string;
  readBy: string[];
};

export type CourseMessage = {
  id: number;
  courseId: number;
  sender: string;
  senderRole: Role;
  body: string;
  createdAt: string;
};

export type LiveSession = {
  id: number;
  courseId: number;
  title: string;
  startsAt: string;
  link: string;
};

export type CourseResource = {
  id: number;
  courseId: number;
  title: string;
  description: string;
  attachment: FileAttachment;
};

export type CalendarEvent = {
  id: string;
  courseId: number;
  courseTitle: string;
  date: string;
  label: string;
  type: "Assignment" | "Live Class";
};

export type StoredPortalState = {
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  courses: Course[];
  courseResources: CourseResource[];
  currentUser: User | null;
  liveSessions: LiveSession[];
  messages: CourseMessage[];
  notifications: Notification[];
  selectedRole: Role;
  submissions: Submission[];
  users: User[];
};

export const roles: Role[] = ["Student", "Teacher", "Admin"];
export const storageKey = "circuit-campus-portal";