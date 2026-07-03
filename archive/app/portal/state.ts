/* eslint-disable */
type Role = "Student" | "Teacher" | "Admin";
type AuthMode = "login" | "register";
type SubmissionStatus = "Submitted" | "Reviewed";
type AttendanceStatus = "Present" | "Absent";

type Permission =
  | "canAddCourseResource"
  | "canCreateAssignment"
  | "canCreateCourse"
  | "canEnrollCourse"
  | "canManageUsers"
  | "canMarkAttendance"
  | "canReviewSubmission"
  | "canScheduleLiveClass"
  | "canSendMessage"
  | "canSubmitAssignment";

type User = {
  name: string;
  email: string;
  role: Role;
  status?: "Active" | "Inactive";
};

type Course = {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  meetingLink: string;
  enrolled: string[];
};

type Assignment = {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  instructions: string;
};

type FileAttachment = {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  response: string;
  status: SubmissionStatus;
  attachment?: FileAttachment;
  grade?: string;
  feedback?: string;
};

type AttendanceRecord = {
  id: string;
  courseId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
};

type PortalNotification = {
  id: string;
  title: string;
  message: string;
  audience: Role | "All";
  createdAt: string;
  readBy: string[];
};

type CourseMessage = {
  id: string;
  courseId: string;
  senderId: string;
  senderRole: Role;
  body: string;
  createdAt: string;
};

type LiveSession = {
  id: string;
  courseId: string;
  title: string;
  startsAt: string;
  link: string;
};

type CourseResource = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  attachment: FileAttachment;
};

type CalendarEvent = {
  id: string;
  courseId: string;
  courseTitle: string;
  date: string;
  label: string;
  type: "Assignment" | "Live Class";
};

type StoredPortalState = {
  version: number;
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

const roles: Role[] = ["Student", "Teacher", "Admin"];
const storageKey = "circuit-campus-portal";
const storageVersion = 2;

const rolePermissions: Record<Role, Permission[]> = {
  Admin: ["canManageUsers"],
  Student: ["canEnrollCourse", "canSendMessage", "canSubmitAssignment"],
  Teacher: [
    "canAddCourseResource",
    "canCreateAssignment",
    "canCreateCourse",
    "canMarkAttendance",
    "canReviewSubmission",
    "canScheduleLiveClass",
    "canSendMessage",
  ],
};