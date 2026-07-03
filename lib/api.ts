// Typed API client for all backend routes.
// Usage: import { api } from "@/lib/api"

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorEmail?: string;
  teacherId: string;
  students: number;
  enrolled?: boolean;
  studentList?: { id: string; name: string; email: string }[];
  status: string;
  meetingLink?: string | null;
  thumbnail?: string | null;
  createdAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  courseId: string;
  dueDate: string;
  status: string;
  instructions?: string;
  totalMarks?: number;
  submissionCount?: number;
}

export interface AssignmentDetail {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  courseName: string;
  courseId: string;
  totalStudents: number;
  submittedCount: number;
  notSubmittedCount: number;
  submissions: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    submitted: boolean;
    submissionId?: string;
    status: string;
    grade?: string | null;
    feedback?: string | null;
    submittedAt?: string;
  }[];
}

export interface Submission {
  id: string;
  studentId?: string;
  studentName: string;
  assignmentId?: string;
  assignmentTitle: string;
  courseName?: string;
  assignmentDueDate?: string | null;
  response?: string;
  status: string;
  grade?: string | null;
  earnedMarks?: number | null;
  totalMarks?: number | null;
  feedback?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveSession {
  id: string;
  title: string;
  course: string;
  courseId: string;
  start: string;
  end?: string;
  durationMinutes?: number | null;
  link: string;
  joinUrl?: string;
  hostLink?: string | null;
  participantLink?: string;
}

export interface AttendanceRecord {
  id: string;
  course: string;
  student?: string;
  studentId?: string;
  status: "PRESENT" | "ABSENT";
  date: string;
  attendedAt?: string;
  leftAt?: string;
  durationMinutes?: number | null;
  verifiedByTeacher?: boolean;
  notes?: string | null;
}

export interface CourseMessage {
  id: string;
  sender: string;
  senderEmail?: string;
  courseId: string;
  courseName: string;
  text: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  audience: string;
  recipientId?: string | null;
  createdAt: string;
  readBy?: { id: string; userId: string; readAt: string }[];
}

export interface AnalyticsStudent {
  enrolledCourses: number;
  pendingAssignments: number;
  submittedAssignments: number;
  totalAssignments: number;
  averageCompletion: number;
  attendanceRate: number;
}

export interface AnalyticsTeacher {
  totalCourses: number;
  totalStudents: number;
  pendingAssignments: number;
  totalAssignments: number;
  submittedCount: number;
  reviewedCount: number;
  averageCompletion: number;
  upcomingSessions: number;
  courseStats: {
    courseId: string;
    courseName: string;
    totalStudents: number;
    averageGrade: number;
    submitRate: number;
    attendanceRate: number;
  }[];
}

export interface AnalyticsAdmin {
  activeUsers: number;
  totalUsers: number;
  coursesPublished: number;
  averageCompletion: number;
  liveSessionsToday: number;
  newRegistrations: number;
  averageAttendance: number;
  totalSubmissions: number;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || "Request failed");
  }
  return res.json() as Promise<T>;
}

function json(body: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const api = {
  auth: {
    session: () => apiFetch<{ user: AuthUser | null }>("/api/auth/session"),

    login: (email: string, password: string) =>
      apiFetch<{ user: AuthUser; token: string }>("/api/auth/login", {
        method: "POST",
        ...json({ email, password }),
      }),

    register: (name: string, email: string, password: string) =>
      apiFetch<{ user: AuthUser }>("/api/auth/register", {
        method: "POST",
        ...json({ name, email, password, role: "STUDENT" }),
      }),

    logout: () => apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),
  },

  courses: {
    list: () => apiFetch<Course[]>("/api/courses"),

    get: (id: string) => apiFetch<Course>(`/api/courses/${id}`),

    create: (data: { title: string; description: string; meetingLink?: string; thumbnail?: string }) =>
      apiFetch<Course>("/api/courses", { method: "POST", ...json(data) }),

    update: (
      id: string,
      data: { title?: string; description?: string; meetingLink?: string; thumbnail?: string; teacherId?: string },
    ) => apiFetch<Course>(`/api/courses/${id}`, { method: "PATCH", ...json(data) }),

    delete: (id: string) =>
      apiFetch<{ message: string }>(`/api/courses/${id}`, { method: "DELETE" }),

    enroll: (id: string) => apiFetch<Course>(`/api/courses/${id}`, { method: "POST" }),
  },

  assignments: {
    list: () => apiFetch<Assignment[]>("/api/assignments"),

    get: (id: string) => apiFetch<AssignmentDetail>(`/api/assignments/${id}`),

    create: (data: {
      title: string;
      instructions: string;
      dueDate: string;
      courseId: string;
      totalMarks?: number;
    }) => apiFetch<Assignment>("/api/assignments", { method: "POST", ...json(data) }),
  },

  submissions: {
    list: (assignmentId?: string) =>
      apiFetch<Submission[]>(
        `/api/submissions${assignmentId ? `?assignmentId=${assignmentId}` : ""}`,
      ),

    submit: (formData: FormData) =>
      apiFetch<Submission>("/api/submissions", { method: "POST", body: formData }),

    grade: (data: { id: string; earnedMarks?: number | null; feedback?: string; assignmentId?: string }) =>
      apiFetch<Submission>("/api/submissions", { method: "PATCH", ...json(data) }),
  },

  live: {
    list: () => apiFetch<LiveSession[]>("/api/live"),

    create: (data: {
      title: string;
      courseId: string;
      start: string;
      end?: string;
      link: string;
      hostLink?: string;
    }) => apiFetch<LiveSession>("/api/live", { method: "POST", ...json(data) }),

    get: (id: string) => apiFetch<LiveSession>(`/api/live-sessions/${id}`),

    attendance: {
      get: (sessionId: string) =>
        apiFetch<{
          liveSessionId: string;
          courseId: string;
          sessionTitle: string;
          sessionStartsAt: string;
          sessionEndsAt: string | null;
          attendanceList: {
            studentId: string;
            studentName: string;
            studentEmail: string;
            status: "PRESENT" | "ABSENT";
            attendedAt: string | null;
            leftAt: string | null;
            durationMinutes: number | null;
            verifiedByTeacher: boolean;
            notes: string;
            recordId: string | null;
          }[];
        }>(`/api/live-sessions/${sessionId}/attendance`),

      override: (
        sessionId: string,
        data: { studentId: string; status?: string; notes?: string; durationMinutes?: number },
      ) =>
        apiFetch<{ recordId: string; studentId: string; status: string }>(
          `/api/live-sessions/${sessionId}/attendance`,
          { method: "PATCH", ...json(data) },
        ),

      track: (sessionId: string, action: "join" | "leave") =>
        apiFetch<{ recordId: string; status: string; durationMinutes?: number; message: string }>(
          `/api/live-sessions/${sessionId}/attendance-tracking`,
          { method: "POST", ...json({ action }) },
        ),

      status: (sessionId: string) =>
        apiFetch<{ status: string; record: AttendanceRecord | null }>(
          `/api/live-sessions/${sessionId}/attendance-tracking`,
        ),
    },
  },

  attendance: {
    list: (courseId?: string) =>
      apiFetch<AttendanceRecord[]>(
        `/api/attendance${courseId ? `?courseId=${courseId}` : ""}`,
      ),

    create: (data: { studentId: string; courseId: string; status: string; date?: string }) =>
      apiFetch<AttendanceRecord>("/api/attendance", { method: "POST", ...json(data) }),

    update: (id: string, status: "PRESENT" | "ABSENT") =>
      apiFetch<AttendanceRecord>("/api/attendance", { method: "PATCH", ...json({ id, status }) }),

    studentRecords: () => apiFetch<AttendanceRecord[]>("/api/student/attendance-records"),
  },

  messages: {
    list: () => apiFetch<CourseMessage[]>("/api/messages"),

    send: (courseId: string, text: string) =>
      apiFetch<CourseMessage>("/api/messages", { method: "POST", ...json({ courseId, text }) }),
  },

  notifications: {
    list: (role?: string, userId?: string) => {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      if (userId) params.set("userId", userId);
      const qs = params.toString();
      return apiFetch<Notification[]>(`/api/notifications${qs ? `?${qs}` : ""}`);
    },

    create: (data: { title: string; message: string; audience: string; recipientId?: string }) =>
      apiFetch<Notification>("/api/notifications", { method: "POST", ...json(data) }),
  },

  analytics: {
    get: () => apiFetch<AnalyticsStudent | AnalyticsTeacher | AnalyticsAdmin>("/api/analytics"),
  },

  users: {
    list: (role?: "STUDENT" | "TEACHER" | "ADMIN") =>
      apiFetch<SafeUser[]>(`/api/users${role ? `?role=${role}` : ""}`),
  },

  upload: {
    file: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch<{ file: { name: string; size: number; type: string; url: string } }>(
        "/api/upload",
        { method: "POST", body: fd },
      );
    },
  },

  admin: {
    registration: {
      get: () => apiFetch<{ open: boolean }>("/api/admin/registration"),
      set: (open: boolean) =>
        apiFetch<{ open: boolean }>("/api/admin/registration", {
          method: "PATCH",
          ...json({ open }),
        }),
    },

    inviteTeacher: (email: string, name: string) =>
      apiFetch<{ inviteId: string; email: string; inviteUrl: string }>(
        "/api/admin/invites/teachers",
        { method: "POST", ...json({ email, name }) },
      ),

    teachers: () => apiFetch<SafeUser[]>("/api/admin/teachers"),

    reports: () =>
      apiFetch<{
        enrollmentGrowth: { value: number; currentMonth: number; previousMonth: number };
        completionTrends: { value: number; totalAssignments: number; completedCount: number };
        userActivity: {
          strongestBlock: string;
          morningAttendance: number;
          afternoonAttendance: number;
          eveningAttendance: number;
          totalSessionAttendance: number;
        };
        systemOverview: {
          activeUsers: number;
          totalCourses: number;
          totalEnrollments: number;
          totalAssignments: number;
          totalSubmissions: number;
        };
      }>("/api/admin/reports"),

    activity: () =>
      apiFetch<
        {
          id: string;
          type: string;
          description: string;
          user: string;
          timestamp: string;
          severity: string;
        }[]
      >("/api/activity"),
  },

  teacher: {
    students: () => apiFetch<SafeUser[]>("/api/teacher/students"),
    acceptInvite: (token: string, password: string) =>
      apiFetch<{ user: SafeUser }>("/api/teacher/invites/accept", {
        method: "POST",
        ...json({ token, password }),
      }),
  },
};
