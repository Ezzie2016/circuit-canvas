"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "Student" | "Teacher" | "Admin";
type AuthMode = "login" | "register";
type SubmissionStatus = "Submitted" | "Reviewed";
type AttendanceStatus = "Present" | "Absent";

type User = {
  name: string;
  email: string;
  role: Role;
  status?: "Active" | "Inactive";
};

type Course = {
  id: number;
  title: string;
  description: string;
  teacher: string;
  meetingLink: string;
  enrolled: string[];
};

type Assignment = {
  id: number;
  courseId: number;
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
  id: number;
  assignmentId: number;
  student: string;
  response: string;
  status: SubmissionStatus;
  attachment?: FileAttachment;
  grade?: string;
  feedback?: string;
};

type AttendanceRecord = {
  id: number;
  courseId: number;
  student: string;
  date: string;
  status: AttendanceStatus;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  audience: Role | "All";
  createdAt: string;
  readBy: string[];
};

type CourseMessage = {
  id: number;
  courseId: number;
  sender: string;
  senderRole: Role;
  body: string;
  createdAt: string;
};

type LiveSession = {
  id: number;
  courseId: number;
  title: string;
  startsAt: string;
  link: string;
};

type CourseResource = {
  id: number;
  courseId: number;
  title: string;
  description: string;
  attachment: FileAttachment;
};

type CalendarEvent = {
  id: string;
  courseId: number;
  courseTitle: string;
  date: string;
  label: string;
  type: "Assignment" | "Live Class";
};

type StoredPortalState = {
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

const initialUsers: User[] = [
  {
    name: "Alex Morgan",
    email: "student@campus.edu",
    role: "Student",
    status: "Active",
  },
  {
    name: "Ms. Rivera",
    email: "rivera@campus.edu",
    role: "Teacher",
    status: "Active",
  },
  {
    name: "Mr. Chen",
    email: "chen@campus.edu",
    role: "Teacher",
    status: "Active",
  },
  {
    name: "Taylor Brooks",
    email: "admin@campus.edu",
    role: "Admin",
    status: "Active",
  },
];

const initialCourses: Course[] = [
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

const initialAssignments: Assignment[] = [
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

const initialSubmissions: Submission[] = [
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

const initialAttendanceRecords: AttendanceRecord[] = [
  {
    id: 1,
    courseId: 1,
    student: "student@campus.edu",
    date: "2026-05-20",
    status: "Present",
  },
  {
    id: 2,
    courseId: 3,
    student: "student@campus.edu",
    date: "2026-05-19",
    status: "Absent",
  },
];

const initialNotifications: Notification[] = [
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

const initialMessages: CourseMessage[] = [
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

const initialLiveSessions: LiveSession[] = [
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

const initialCourseResources: CourseResource[] = [
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

function readStoredPortalState(): StoredPortalState | null {
  try {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as StoredPortalState;
  } catch {
    return null;
  }
}

function createNotification(
  title: string,
  message: string,
  audience: Notification["audience"],
): Notification {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    message,
    audience,
    createdAt: new Date().toISOString().slice(0, 10),
    readBy: [],
  };
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildCalendarEvents(
  assignments: Assignment[],
  liveSessions: LiveSession[],
  courses: Course[],
) {
  const assignmentEvents = assignments.map((assignment) => {
    const course = courses.find((item) => item.id === assignment.courseId);

    return {
      id: `assignment-${assignment.id}`,
      courseId: assignment.courseId,
      courseTitle: course?.title || "Course",
      date: assignment.dueDate,
      label: assignment.title,
      type: "Assignment" as const,
    };
  });
  const liveClassEvents = liveSessions.map((session) => {
    const course = courses.find((item) => item.id === session.courseId);

    return {
      id: `live-${session.id}`,
      courseId: session.courseId,
      courseTitle: course?.title || "Course",
      date: session.startsAt,
      label: session.title,
      type: "Live Class" as const,
    };
  });

  return [...assignmentEvents, ...liveClassEvents].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export default function PortalApp({ preferredRole }: { preferredRole?: Role }) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<Role>(
    preferredRole || "Student",
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [courseResources, setCourseResources] =
    useState<CourseResource[]>(initialCourseResources);
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >(initialAttendanceRecords);
  const [submissions, setSubmissions] =
    useState<Submission[]>(initialSubmissions);
  const [liveSessions, setLiveSessions] =
    useState<LiveSession[]>(initialLiveSessions);
  const [messages, setMessages] = useState<CourseMessage[]>(initialMessages);
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [notice, setNotice] = useState("Use any email to enter the demo.");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const stored = readStoredPortalState();

      if (stored) {
        setAssignments(stored.assignments);
        setAttendanceRecords(
          stored.attendanceRecords || initialAttendanceRecords,
        );
        setCourses(stored.courses);
        setCourseResources(stored.courseResources || initialCourseResources);
        setCurrentUser(stored.currentUser);
        setLiveSessions(stored.liveSessions || initialLiveSessions);
        setMessages(stored.messages || initialMessages);
        setNotifications(stored.notifications || initialNotifications);
        setSelectedRole(stored.selectedRole);
        setSubmissions(stored.submissions);
        setUsers(stored.users || initialUsers);
        setNotice(
          stored.currentUser
            ? "Restored your saved portal session."
            : "Restored saved portal data.",
        );
      }

      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const state: StoredPortalState = {
      assignments,
      attendanceRecords,
      courses,
      courseResources,
      currentUser,
      liveSessions,
      messages,
      notifications,
      selectedRole,
      submissions,
      users,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [
    assignments,
    attendanceRecords,
    courses,
    courseResources,
    currentUser,
    liveSessions,
    messages,
    notifications,
    selectedRole,
    storageReady,
    submissions,
    users,
  ]);

  function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roleForAuth = preferredRole || selectedRole;
    const name =
      String(form.get("name") || "").trim() ||
      (roleForAuth === "Student" ? "Alex Morgan" : "Taylor Brooks");
    const email =
      String(form.get("email") || "").trim() ||
      (roleForAuth === "Student"
        ? "student@campus.edu"
        : roleForAuth === "Teacher"
          ? "teacher@campus.edu"
          : "admin@campus.edu");

    const existingUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser?.status === "Inactive") {
      setNotice("This account is inactive. Ask an admin to reactivate it.");
      return;
    }

    const signedInUser = existingUser || {
      name,
      email,
      role: roleForAuth,
      status: "Active" as const,
    };

    if (!existingUser) {
      setUsers((current) => [...current, signedInUser]);
    }

    setCurrentUser(signedInUser);
    setNotice(
      `${signedInUser.role} ${authMode === "login" ? "login" : "account"} ready.`,
    );
  }

  function handleLogout() {
    setCurrentUser(null);
    setNotice("Signed out. Choose a role to continue.");
  }

  function handleResetDemo() {
    window.localStorage.removeItem(storageKey);
    setAssignments(initialAssignments);
    setAttendanceRecords(initialAttendanceRecords);
    setCourses(initialCourses);
    setCourseResources(initialCourseResources);
    setCurrentUser(null);
    setLiveSessions(initialLiveSessions);
    setMessages(initialMessages);
    setNotifications(initialNotifications);
    setSelectedRole("Student");
    setSubmissions(initialSubmissions);
    setUsers(initialUsers);
    setNotice("Demo data reset. Start fresh with any role.");
  }

  const activeUser =
    preferredRole && currentUser?.role !== preferredRole ? null : currentUser;

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-[#17211b]">
      {!activeUser ? (
        <AuthScreen
          authMode={authMode}
          notice={notice}
          selectedRole={selectedRole}
          onAuth={handleAuth}
          onModeChange={setAuthMode}
          onRoleChange={setSelectedRole}
        />
      ) : (
        <Portal
          assignments={assignments}
          attendanceRecords={attendanceRecords}
          courses={courses}
          courseResources={courseResources}
          liveSessions={liveSessions}
          messages={messages}
          notifications={notifications}
          notice={notice}
          submissions={submissions}
          user={activeUser}
          users={users}
          onAddUser={(user) => {
            const exists = users.some(
              (item) => item.email.toLowerCase() === user.email.toLowerCase(),
            );

            if (exists) {
              setNotice("That user already exists in the directory.");
              return;
            }

            setUsers((current) => [...current, { ...user, status: "Active" }]);
            setNotifications((current) => [
              createNotification(
                "User added",
                `${user.name} was added as a ${user.role}.`,
                "Admin",
              ),
              ...current,
            ]);
            setNotice(`${user.role} account added to the directory.`);
          }}
          onAssignmentCreate={(assignment) => {
            setAssignments((current) => [
              ...current,
              { ...assignment, id: Date.now() },
            ]);
            setNotifications((current) => [
              createNotification(
                "New assignment posted",
                `${assignment.title} is now available for enrolled students.`,
                "Student",
              ),
              ...current,
            ]);
            setNotice("Assignment created and visible to enrolled students.");
          }}
          onCourseCreate={(course) => {
            setCourses((current) => [
              ...current,
              { ...course, id: Date.now(), teacher: activeUser.name },
            ]);
            setNotifications((current) => [
              createNotification(
                "New course created",
                `${course.title} is open for enrollment.`,
                "All",
              ),
              ...current,
            ]);
            setNotice("Course created with a live meeting link.");
          }}
          onCourseResourceCreate={(resource) => {
            setCourseResources((current) => [
              ...current,
              { ...resource, id: Date.now() },
            ]);
            setNotifications((current) => [
              createNotification(
                "Course material added",
                `${resource.title} is now available in course materials.`,
                "Student",
              ),
              ...current,
            ]);
            setNotice("Course material added for students.");
          }}
          onEnroll={(courseId) => {
            setCourses((current) =>
              current.map((course) =>
                course.id === courseId &&
                !course.enrolled.includes(activeUser.email)
                  ? {
                      ...course,
                      enrolled: [...course.enrolled, activeUser.email],
                    }
                  : course,
              ),
            );
            setNotifications((current) => [
              createNotification(
                "Student enrolled",
                `${activeUser.email} enrolled in a course.`,
                "Teacher",
              ),
              ...current,
            ]);
            setNotice("You are enrolled. The class is now on your dashboard.");
          }}
          onLogout={handleLogout}
          onMarkAttendance={(courseId, student, status) => {
            const today = new Date().toISOString().slice(0, 10);

            setAttendanceRecords((current) => {
              const existing = current.find(
                (record) =>
                  record.courseId === courseId &&
                  record.student === student &&
                  record.date === today,
              );

              if (existing) {
                return current.map((record) =>
                  record.id === existing.id ? { ...record, status } : record,
                );
              }

              return [
                ...current,
                {
                  id: Date.now(),
                  courseId,
                  student,
                  date: today,
                  status,
                },
              ];
            });
            setNotifications((current) => [
              createNotification(
                "Attendance updated",
                `${student} was marked ${status.toLowerCase()} today.`,
                "Student",
              ),
              ...current,
            ]);
            setNotice(`Attendance marked ${status.toLowerCase()} for ${student}.`);
          }}
          onMarkNotificationRead={(notificationId) => {
            setNotifications((current) =>
              current.map((notification) =>
                notification.id === notificationId &&
                !notification.readBy.includes(activeUser.email)
                  ? {
                      ...notification,
                      readBy: [...notification.readBy, activeUser.email],
                    }
                  : notification,
              ),
            );
          }}
          onLiveSessionCreate={(session) => {
            setLiveSessions((current) => [
              ...current,
              { ...session, id: Date.now() },
            ]);
            setNotifications((current) => [
              createNotification(
                "Live class scheduled",
                `${session.title} has been added to the class schedule.`,
                "Student",
              ),
              ...current,
            ]);
            setNotice("Live class session scheduled.");
          }}
          onMessageSend={(courseId, body) => {
            setMessages((current) => [
              {
                id: Date.now(),
                courseId,
                sender:
                  activeUser.role === "Teacher"
                    ? activeUser.name
                    : activeUser.email,
                senderRole: activeUser.role,
                body,
                createdAt: new Date().toISOString().slice(0, 10),
              },
              ...current,
            ]);
            setNotifications((current) => [
              createNotification(
                "New course message",
                `${activeUser.role} posted a message in a course conversation.`,
                activeUser.role === "Student" ? "Teacher" : "Student",
              ),
              ...current,
            ]);
            setNotice("Message sent to the course conversation.");
          }}
          onResetDemo={handleResetDemo}
          onReview={(submissionId, grade, feedback) => {
            setSubmissions((current) =>
              current.map((submission) =>
                submission.id === submissionId
                  ? {
                      ...submission,
                      status: "Reviewed",
                      grade,
                      feedback,
                    }
                  : submission,
              ),
            );
            setNotifications((current) => [
              createNotification(
                "Submission reviewed",
                `Your submission has been reviewed with grade ${grade}.`,
                "Student",
              ),
              ...current,
            ]);
            setNotice("Submission reviewed and grade posted.");
          }}
          onSubmit={(assignmentId, response, attachment) => {
            setSubmissions((current) => [
              ...current,
              {
                id: Date.now(),
                assignmentId,
                attachment,
                student: activeUser.email,
                response,
                status: "Submitted",
              },
            ]);
            setNotifications((current) => [
              createNotification(
                "Submission received",
                `${activeUser.email} submitted an assignment${attachment ? " with a file" : ""} for review.`,
                "Teacher",
              ),
              ...current,
            ]);
            setNotice("Assignment submitted for teacher review.");
          }}
          onToggleUserStatus={(email) => {
            setUsers((current) =>
              current.map((user) =>
                user.email === email
                  ? {
                      ...user,
                      status:
                        user.status === "Inactive" ? "Active" : "Inactive",
                    }
                  : user,
              ),
            );
            setNotice("User status updated.");
          }}
        />
      )}
    </main>
  );
}

function AuthScreen({
  authMode,
  notice,
  selectedRole,
  onAuth,
  onModeChange,
  onRoleChange,
}: {
  authMode: AuthMode;
  notice: string;
  selectedRole: Role;
  onAuth: (event: FormEvent<HTMLFormElement>) => void;
  onModeChange: (mode: AuthMode) => void;
  onRoleChange: (role: Role) => void;
}) {
  return (
    <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-5 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
      <div className="flex min-h-[360px] flex-col justify-between rounded-lg bg-[#1d6d58] p-8 text-white shadow-sm lg:p-10">
        <nav className="flex items-center justify-between">
          <div className="text-lg font-semibold">Circuit Campus</div>
          <div className="hidden items-center gap-2 text-sm text-white/80 sm:flex">
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/student">
              Student
            </Link>
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/teacher">
              Teacher
            </Link>
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/admin">
              Admin
            </Link>
          </div>
        </nav>
        <div className="max-w-2xl py-16">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-[#b8d8cb]">
            Learning management
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Courses, assignments, grades, and class links in one calm workspace.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/76 md:text-lg">
            Students enroll and submit work. Teachers create courses, post
            assignments, add meeting links, and review submissions. Admins see
            the health of the school at a glance.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-white/84 sm:grid-cols-3">
          <div className="rounded-md bg-white/10 p-4">
            <strong className="block text-2xl text-white">3</strong>
            Role dashboards
          </div>
          <div className="rounded-md bg-white/10 p-4">
            <strong className="block text-2xl text-white">2</strong>
            Active assignments
          </div>
          <div className="rounded-md bg-white/10 p-4">
            <strong className="block text-2xl text-white">1</strong>
            Reviewed grade
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className="w-full rounded-lg border border-[#d8ddd2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex rounded-md bg-[#eef1e9] p-1">
            {(["login", "register"] as AuthMode[]).map((mode) => (
              <button
                className={`h-11 flex-1 rounded px-4 text-sm font-semibold capitalize transition ${
                  authMode === mode
                    ? "bg-white text-[#1d6d58] shadow-sm"
                    : "text-[#58645d] hover:text-[#17211b]"
                }`}
                key={mode}
                onClick={() => onModeChange(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-[#667068]">{notice}</p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2">
            {roles.map((role) => (
              <button
                className={`rounded-md border px-3 py-3 text-sm font-semibold transition ${
                  selectedRole === role
                    ? "border-[#1d6d58] bg-[#e1f1ea] text-[#1d6d58]"
                    : "border-[#d8ddd2] text-[#58645d] hover:border-[#9db2a8]"
                }`}
                key={role}
                onClick={() => onRoleChange(role)}
                type="button"
              >
                {role}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={onAuth}>
            {authMode === "register" ? (
              <Field label="Full name" name="name" placeholder="Alex Morgan" />
            ) : null}
            <Field
              label="Email"
              name="email"
              placeholder={
                selectedRole === "Student"
                  ? "student@campus.edu"
                  : selectedRole === "Teacher"
                    ? "teacher@campus.edu"
                    : "admin@campus.edu"
              }
              type="email"
            />
            <Field
              label="Password"
              name="password"
              placeholder="Any password works"
              type="password"
            />
            <button
              className="h-12 w-full rounded-md bg-[#1d6d58] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#124e40]"
              type="submit"
            >
              Continue as {selectedRole}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Portal({
  assignments,
  attendanceRecords,
  courses,
  courseResources,
  liveSessions,
  messages,
  notifications,
  notice,
  submissions,
  user,
  users,
  onAddUser,
  onAssignmentCreate,
  onCourseCreate,
  onCourseResourceCreate,
  onEnroll,
  onLogout,
  onLiveSessionCreate,
  onMarkAttendance,
  onMarkNotificationRead,
  onMessageSend,
  onResetDemo,
  onReview,
  onSubmit,
  onToggleUserStatus,
}: {
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  courses: Course[];
  courseResources: CourseResource[];
  liveSessions: LiveSession[];
  messages: CourseMessage[];
  notifications: Notification[];
  notice: string;
  submissions: Submission[];
  user: User;
  users: User[];
  onAddUser: (user: User) => void;
  onAssignmentCreate: (assignment: Omit<Assignment, "id">) => void;
  onCourseCreate: (course: Omit<Course, "id" | "teacher">) => void;
  onCourseResourceCreate: (resource: Omit<CourseResource, "id">) => void;
  onEnroll: (courseId: number) => void;
  onLogout: () => void;
  onLiveSessionCreate: (session: Omit<LiveSession, "id">) => void;
  onMarkAttendance: (
    courseId: number,
    student: string,
    status: AttendanceStatus,
  ) => void;
  onMarkNotificationRead: (notificationId: number) => void;
  onMessageSend: (courseId: number, body: string) => void;
  onResetDemo: () => void;
  onReview: (submissionId: number, grade: string, feedback: string) => void;
  onSubmit: (
    assignmentId: number,
    response: string,
    attachment?: FileAttachment,
  ) => void;
  onToggleUserStatus: (email: string) => void;
}) {
  return (
    <section className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-col gap-4 rounded-lg border border-[#d8ddd2] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6e7c72]">
            {user.role} dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
            Good day, {user.name}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav className="flex flex-wrap gap-2">
            <Link
              className="h-10 rounded-md border border-[#cbd3c5] px-3 py-2 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9]"
              href="/student"
            >
              Student
            </Link>
            <Link
              className="h-10 rounded-md border border-[#cbd3c5] px-3 py-2 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9]"
              href="/teacher"
            >
              Teacher
            </Link>
            <Link
              className="h-10 rounded-md border border-[#cbd3c5] px-3 py-2 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9]"
              href="/admin"
            >
              Admin
            </Link>
          </nav>
          <div className="rounded-md bg-[#eef1e9] px-4 py-3 text-sm text-[#46534b]">
            {notice}
          </div>
          <button
            className="h-10 rounded-md border border-[#cbd3c5] px-4 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9]"
            onClick={onLogout}
            type="button"
          >
            Sign out
          </button>
          <button
            className="h-10 rounded-md border border-[#c9d6cc] px-4 text-sm font-semibold text-[#6b342c] transition hover:bg-[#fff2ee]"
            onClick={onResetDemo}
            type="button"
          >
            Reset demo
          </button>
        </div>
      </header>

      <NotificationCenter
        notifications={notifications}
        onMarkNotificationRead={onMarkNotificationRead}
        user={user}
      />

      {user.role === "Student" ? (
        <StudentDashboard
          assignments={assignments}
          attendanceRecords={attendanceRecords}
          courses={courses}
          courseResources={courseResources}
          liveSessions={liveSessions}
          messages={messages}
          submissions={submissions}
          user={user}
          onEnroll={onEnroll}
          onMessageSend={onMessageSend}
          onSubmit={onSubmit}
        />
      ) : null}

      {user.role === "Teacher" ? (
        <TeacherDashboard
          assignments={assignments}
          attendanceRecords={attendanceRecords}
          courses={courses}
          courseResources={courseResources}
          liveSessions={liveSessions}
          messages={messages}
          submissions={submissions}
          user={user}
          onAssignmentCreate={onAssignmentCreate}
          onCourseCreate={onCourseCreate}
          onCourseResourceCreate={onCourseResourceCreate}
          onLiveSessionCreate={onLiveSessionCreate}
          onMarkAttendance={onMarkAttendance}
          onMessageSend={onMessageSend}
          onReview={onReview}
        />
      ) : null}

      {user.role === "Admin" ? (
        <AdminDashboard
          assignments={assignments}
          attendanceRecords={attendanceRecords}
          courses={courses}
          courseResources={courseResources}
          liveSessions={liveSessions}
          messages={messages}
          submissions={submissions}
          users={users}
          onAddUser={onAddUser}
          onToggleUserStatus={onToggleUserStatus}
        />
      ) : null}
    </section>
  );
}

function NotificationCenter({
  notifications,
  onMarkNotificationRead,
  user,
}: {
  notifications: Notification[];
  onMarkNotificationRead: (notificationId: number) => void;
  user: User;
}) {
  const visibleNotifications = notifications.filter(
    (notification) =>
      notification.audience === "All" || notification.audience === user.role,
  );
  const unreadCount = visibleNotifications.filter(
    (notification) => !notification.readBy.includes(user.email),
  ).length;

  return (
    <section className="mb-5 rounded-lg border border-[#d8ddd2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#778279]">
            Notifications
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
          </h2>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {visibleNotifications.slice(0, 3).map((notification) => {
          const isRead = notification.readBy.includes(user.email);

          return (
            <article
              className={`rounded-md border p-4 ${
                isRead
                  ? "border-[#d8ddd2] bg-white"
                  : "border-[#b8d8cb] bg-[#f1faf5]"
              }`}
              key={notification.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#46534b]">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#778279]">
                    {notification.createdAt} • {notification.audience}
                  </p>
                </div>
                {!isRead ? (
                  <span className="rounded-full bg-[#1d6d58] px-2 py-1 text-xs font-semibold text-white">
                    New
                  </span>
                ) : null}
              </div>
              {!isRead ? (
                <button
                  className="mt-3 h-9 rounded-md border border-[#cbd3c5] px-3 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9]"
                  onClick={() => onMarkNotificationRead(notification.id)}
                  type="button"
                >
                  Mark read
                </button>
              ) : null}
            </article>
          );
        })}
        {!visibleNotifications.length ? (
          <EmptyState text="No notifications for this role yet." />
        ) : null}
      </div>
    </section>
  );
}

function StudentDashboard({
  assignments,
  attendanceRecords,
  courses,
  courseResources,
  liveSessions,
  messages,
  submissions,
  user,
  onEnroll,
  onMessageSend,
  onSubmit,
}: {
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  courses: Course[];
  courseResources: CourseResource[];
  liveSessions: LiveSession[];
  messages: CourseMessage[];
  submissions: Submission[];
  user: User;
  onEnroll: (courseId: number) => void;
  onMessageSend: (courseId: number, body: string) => void;
  onSubmit: (
    assignmentId: number,
    response: string,
    attachment?: FileAttachment,
  ) => void;
}) {
  const enrolledCourses = courses.filter((course) =>
    course.enrolled.includes(user.email),
  );
  const enrolledCourseIds = enrolledCourses.map((course) => course.id);
  const upcomingLiveSessions = liveSessions.filter((session) =>
    enrolledCourseIds.includes(session.courseId),
  );
  const visibleResources = courseResources.filter((resource) =>
    enrolledCourseIds.includes(resource.courseId),
  );
  const upcomingAssignments = assignments.filter((assignment) =>
    enrolledCourseIds.includes(assignment.courseId),
  );
  const calendarEvents = buildCalendarEvents(
    upcomingAssignments,
    upcomingLiveSessions,
    courses,
  );
  const mySubmissions = submissions.filter(
    (submission) => submission.student === user.email,
  );
  const myAttendance = attendanceRecords.filter(
    (record) => record.student === user.email,
  );
  const presentCount = myAttendance.filter(
    (record) => record.status === "Present",
  ).length;
  const attendanceRate = myAttendance.length
    ? Math.round((presentCount / myAttendance.length) * 100)
    : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-5">
        <Panel title="Enrolled courses" eyebrow={`${enrolledCourses.length} active`}>
          <div className="grid gap-3 md:grid-cols-2">
            {enrolledCourses.map((course) => (
              <CourseCard course={course} key={course.id} enrolled />
            ))}
          </div>
        </Panel>

        <Panel title="Course catalog" eyebrow="Enroll in seconds">
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((course) => (
              <CourseCard
                course={course}
                enrolled={course.enrolled.includes(user.email)}
                key={course.id}
                onEnroll={() => onEnroll(course.id)}
              />
            ))}
          </div>
        </Panel>
        <CalendarPanel events={calendarEvents} title="Academic calendar" />
      </section>

      <section className="space-y-5">
        <Panel title="Upcoming assignments" eyebrow="Submit work">
          <div className="space-y-3">
            {upcomingAssignments.map((assignment) => {
              const course = courses.find(
                (item) => item.id === assignment.courseId,
              );
              const submitted = mySubmissions.some(
                (submission) => submission.assignmentId === assignment.id,
              );

              return (
                <AssignmentSubmitCard
                  assignment={assignment}
                  courseTitle={course?.title || "Course"}
                  key={assignment.id}
                  onSubmit={onSubmit}
                  submitted={submitted}
                />
              );
            })}
          </div>
        </Panel>

        <Panel title="Grades" eyebrow="Reviewed submissions">
          <div className="space-y-3">
            {mySubmissions.length ? (
              mySubmissions.map((submission) => {
                const assignment = assignments.find(
                  (item) => item.id === submission.assignmentId,
                );
                return (
                  <div
                    className="rounded-md border border-[#d8ddd2] p-4"
                    key={submission.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {assignment?.title || "Assignment"}
                        </h3>
                        <p className="mt-1 text-sm text-[#667068]">
                          {submission.feedback || "Awaiting teacher review."}
                        </p>
                        {submission.attachment ? (
                          <FileAttachmentView attachment={submission.attachment} />
                        ) : null}
                      </div>
                      <span className="rounded-full bg-[#e1f1ea] px-3 py-1 text-sm font-semibold text-[#1d6d58]">
                        {submission.grade || submission.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="No grades yet. Submit an assignment to start." />
            )}
          </div>
        </Panel>

        <Panel title="Attendance" eyebrow={`${attendanceRate}% present`}>
          <div className="space-y-3">
            {myAttendance.length ? (
              myAttendance.map((record) => {
                const course = courses.find(
                  (item) => item.id === record.courseId,
                );

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md border border-[#d8ddd2] p-4"
                    key={record.id}
                  >
                    <div>
                      <h3 className="font-semibold">
                        {course?.title || "Course"}
                      </h3>
                      <p className="mt-1 text-sm text-[#667068]">
                        {record.date}
                      </p>
                    </div>
                    <StatusPill status={record.status} />
                  </div>
                );
              })
            ) : (
              <EmptyState text="No attendance has been marked yet." />
            )}
          </div>
        </Panel>
        <LiveSessionsPanel
          courses={courses}
          liveSessions={upcomingLiveSessions}
          title="Live classes"
        />
        <CourseResourcesPanel
          courses={courses}
          resources={visibleResources}
          title="Course materials"
        />

        <MessagePanel
          courses={enrolledCourses}
          messages={messages}
          onMessageSend={onMessageSend}
          title="Course messages"
          user={user}
        />
      </section>
    </div>
  );
}

function TeacherDashboard({
  assignments,
  attendanceRecords,
  courses,
  courseResources,
  liveSessions,
  messages,
  submissions,
  user,
  onAssignmentCreate,
  onCourseCreate,
  onCourseResourceCreate,
  onLiveSessionCreate,
  onMarkAttendance,
  onMessageSend,
  onReview,
}: {
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  courses: Course[];
  courseResources: CourseResource[];
  liveSessions: LiveSession[];
  messages: CourseMessage[];
  submissions: Submission[];
  user: User;
  onAssignmentCreate: (assignment: Omit<Assignment, "id">) => void;
  onCourseCreate: (course: Omit<Course, "id" | "teacher">) => void;
  onCourseResourceCreate: (resource: Omit<CourseResource, "id">) => void;
  onLiveSessionCreate: (session: Omit<LiveSession, "id">) => void;
  onMarkAttendance: (
    courseId: number,
    student: string,
    status: AttendanceStatus,
  ) => void;
  onMessageSend: (courseId: number, body: string) => void;
  onReview: (submissionId: number, grade: string, feedback: string) => void;
}) {
  const teacherCourses = courses.filter(
    (course) => course.teacher === user.name || course.teacher === "Ms. Rivera",
  );
  const teacherCourseIds = teacherCourses.map((course) => course.id);
  const teacherAssignments = assignments.filter((assignment) =>
    teacherCourseIds.includes(assignment.courseId),
  );
  const teacherLiveSessions = liveSessions.filter((session) =>
    teacherCourseIds.includes(session.courseId),
  );
  const teacherResources = courseResources.filter((resource) =>
    teacherCourseIds.includes(resource.courseId),
  );
  const calendarEvents = buildCalendarEvents(
    teacherAssignments,
    teacherLiveSessions,
    courses,
  );
  const teacherSubmissions = submissions.filter((submission) =>
    teacherAssignments.some(
      (assignment) => assignment.id === submission.assignmentId,
    ),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-5">
        <Panel title="Courses created" eyebrow={`${teacherCourses.length} courses`}>
          <div className="space-y-3">
            {teacherCourses.map((course) => (
              <CourseCard course={course} enrolled key={course.id} />
            ))}
          </div>
        </Panel>
        <CourseForm onCourseCreate={onCourseCreate} />
        <CalendarPanel events={calendarEvents} title="Teaching calendar" />
        <CourseResourceForm
          courses={teacherCourses}
          onCourseResourceCreate={onCourseResourceCreate}
        />
        <CourseResourcesPanel
          courses={courses}
          resources={teacherResources}
          title="Course materials"
        />
        <LiveSessionForm
          courses={teacherCourses}
          onLiveSessionCreate={onLiveSessionCreate}
        />
        <LiveSessionsPanel
          courses={courses}
          liveSessions={teacherLiveSessions}
          title="Scheduled live classes"
        />
        <AttendancePanel
          attendanceRecords={attendanceRecords}
          courses={teacherCourses}
          onMarkAttendance={onMarkAttendance}
        />
      </section>

      <section className="space-y-5">
        <AssignmentForm
          courses={teacherCourses}
          onAssignmentCreate={onAssignmentCreate}
        />
        <Panel
          title="Student submissions"
          eyebrow={`${teacherSubmissions.length} received`}
        >
          <div className="space-y-3">
            {teacherSubmissions.map((submission) => {
              const assignment = assignments.find(
                (item) => item.id === submission.assignmentId,
              );
              return (
                <ReviewCard
                  assignmentTitle={assignment?.title || "Assignment"}
                  key={submission.id}
                  onReview={onReview}
                  submission={submission}
                />
              );
            })}
            {!teacherSubmissions.length ? (
              <EmptyState text="No submissions yet." />
            ) : null}
          </div>
        </Panel>
        <MessagePanel
          courses={teacherCourses}
          messages={messages}
          onMessageSend={onMessageSend}
          title="Course messages"
          user={user}
        />
      </section>
    </div>
  );
}

function AdminDashboard({
  assignments,
  attendanceRecords,
  courses,
  courseResources,
  liveSessions,
  messages,
  submissions,
  users,
  onAddUser,
  onToggleUserStatus,
}: {
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  courses: Course[];
  courseResources: CourseResource[];
  liveSessions: LiveSession[];
  messages: CourseMessage[];
  submissions: Submission[];
  users: User[];
  onAddUser: (user: User) => void;
  onToggleUserStatus: (email: string) => void;
}) {
  const totalStudents = useMemo(
    () =>
      users.filter(
        (user) => user.role === "Student" && user.status !== "Inactive",
      ).length,
    [users],
  );
  const totalTeachers = useMemo(
    () =>
      users.filter(
        (user) => user.role === "Teacher" && user.status !== "Inactive",
      ).length,
    [users],
  );
  const presentCount = attendanceRecords.filter(
    (record) => record.status === "Present",
  ).length;
  const attendanceRate = attendanceRecords.length
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;
  const reviewedCount = submissions.filter(
    (submission) => submission.status === "Reviewed",
  ).length;
  const submissionReviewRate = submissions.length
    ? Math.round((reviewedCount / submissions.length) * 100)
    : 0;
  const courseAnalytics = courses.map((course) => {
    const courseAssignments = assignments.filter(
      (assignment) => assignment.courseId === course.id,
    );
    const courseAssignmentIds = courseAssignments.map(
      (assignment) => assignment.id,
    );
    const courseSubmissions = submissions.filter((submission) =>
      courseAssignmentIds.includes(submission.assignmentId),
    );
    const courseAttendance = attendanceRecords.filter(
      (record) => record.courseId === course.id,
    );
    const coursePresent = courseAttendance.filter(
      (record) => record.status === "Present",
    ).length;
    const courseMessages = messages.filter(
      (message) => message.courseId === course.id,
    );

    return {
      attendanceRate: courseAttendance.length
        ? Math.round((coursePresent / courseAttendance.length) * 100)
        : 0,
      assignmentCount: courseAssignments.length,
      course,
      messageCount: courseMessages.length,
      submissionCount: courseSubmissions.length,
    };
  });
  const calendarEvents = buildCalendarEvents(assignments, liveSessions, courses);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total students" value={totalStudents} />
        <Metric label="Total teachers" value={totalTeachers} />
        <Metric label="Total courses" value={courses.length} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <UserManagementPanel
          onAddUser={onAddUser}
          onToggleUserStatus={onToggleUserStatus}
          users={users}
        />
        <CalendarPanel events={calendarEvents} title="School calendar" />
        <Panel title="Course management" eyebrow="Catalog overview">
          <div className="space-y-3">
            {courses.map((course) => (
              <CourseCard course={course} enrolled key={course.id} />
            ))}
          </div>
        </Panel>
        <Panel title="Academic activity" eyebrow="Live counts">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Assignments" value={assignments.length} compact />
            <Metric label="Submissions" value={submissions.length} compact />
            <Metric label="Messages" value={messages.length} compact />
            <Metric label="Materials" value={courseResources.length} compact />
            <Metric label="Live classes" value={liveSessions.length} compact />
            <Metric
              label="Attendance rate"
              value={attendanceRate}
              suffix="%"
              compact
            />
            <Metric
              label="Reviewed"
              value={
                submissions.filter(
                  (submission) => submission.status === "Reviewed",
                ).length
              }
              compact
            />
            <Metric
              label="Pending"
              value={
                submissions.filter(
                  (submission) => submission.status === "Submitted",
                ).length
              }
              compact
            />
          </div>
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Performance analytics" eyebrow="System health">
          <div className="space-y-4">
            <ProgressMetric
              label="Attendance rate"
              value={attendanceRate}
              tone="green"
            />
            <ProgressMetric
              label="Submission review rate"
              value={submissionReviewRate}
              tone="gold"
            />
            <ProgressMetric
              label="Course engagement"
              value={Math.min(100, Math.round(messages.length * 18))}
              tone="blue"
            />
          </div>
        </Panel>
        <Panel title="Course analytics" eyebrow="Per course">
          <div className="space-y-3">
            {courseAnalytics.map((item) => (
              <CourseAnalyticsRow
                attendanceRate={item.attendanceRate}
                assignmentCount={item.assignmentCount}
                course={item.course}
                key={item.course.id}
                messageCount={item.messageCount}
                submissionCount={item.submissionCount}
              />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function UserManagementPanel({
  onAddUser,
  onToggleUserStatus,
  users,
}: {
  onAddUser: (user: User) => void;
  onToggleUserStatus: (email: string) => void;
  users: User[];
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const role = String(form.get("role") || "Student") as Role;

    if (!name || !email) {
      return;
    }

    onAddUser({ name, email, role, status: "Active" });
    event.currentTarget.reset();
  }

  return (
    <Panel title="User management" eyebrow={`${users.length} accounts`}>
      <form className="grid gap-3 lg:grid-cols-[1fr_1fr_140px_auto]" onSubmit={handleSubmit}>
        <Field label="Name" name="name" placeholder="Jordan Lee" />
        <Field
          label="Email"
          name="email"
          placeholder="jordan@campus.edu"
          type="email"
        />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#46534b]">
            Role
          </span>
          <select
            className="h-11 w-full rounded-md border border-[#cbd3c5] bg-white px-3 text-sm outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
            name="role"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <PrimaryButton>Add user</PrimaryButton>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {users.map((user) => (
          <div
            className="flex flex-col justify-between gap-3 rounded-md border border-[#d8ddd2] p-4 sm:flex-row sm:items-center"
            key={user.email}
          >
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <p className="mt-1 text-sm text-[#667068]">
                {user.email} • {user.role}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  user.status === "Inactive"
                    ? "bg-[#fff2ee] text-[#6b342c]"
                    : "bg-[#e1f1ea] text-[#1d6d58]"
                }`}
              >
                {user.status || "Active"}
              </span>
              <button
                className="h-10 rounded-md border border-[#cbd3c5] px-3 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9]"
                onClick={() => onToggleUserStatus(user.email)}
                type="button"
              >
                {user.status === "Inactive" ? "Reactivate" : "Deactivate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CalendarPanel({
  events,
  title,
}: {
  events: CalendarEvent[];
  title: string;
}) {
  return (
    <Panel title={title} eyebrow={`${events.length} upcoming`}>
      <div className="space-y-3">
        {events.length ? (
          events.slice(0, 6).map((event) => (
            <article
              className="flex flex-col justify-between gap-3 rounded-md border border-[#d8ddd2] p-4 sm:flex-row sm:items-center"
              key={event.id}
            >
              <div>
                <h3 className="font-semibold">{event.label}</h3>
                <p className="mt-1 text-sm text-[#667068]">
                  {event.courseTitle} • {event.date.replace("T", " ")}
                </p>
              </div>
              <span
                className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  event.type === "Live Class"
                    ? "bg-[#e1f1ea] text-[#1d6d58]"
                    : "bg-[#fff2d7] text-[#7a4c00]"
                }`}
              >
                {event.type}
              </span>
            </article>
          ))
        ) : (
          <EmptyState text="No calendar events yet." />
        )}
      </div>
    </Panel>
  );
}

function ProgressMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "blue" | "gold" | "green";
  value: number;
}) {
  const toneClass =
    tone === "green"
      ? "bg-[#1d6d58]"
      : tone === "gold"
        ? "bg-[#b7771e]"
        : "bg-[#315d82]";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#46534b]">{label}</p>
        <p className="text-sm font-semibold text-[#17211b]">{value}%</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#eef1e9]">
        <div
          className={`h-full rounded-full ${toneClass}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function CourseAnalyticsRow({
  attendanceRate,
  assignmentCount,
  course,
  messageCount,
  submissionCount,
}: {
  attendanceRate: number;
  assignmentCount: number;
  course: Course;
  messageCount: number;
  submissionCount: number;
}) {
  return (
    <article className="rounded-md border border-[#d8ddd2] p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="font-semibold">{course.title}</h3>
          <p className="mt-1 text-sm text-[#667068]">
            {course.enrolled.length} students • {course.teacher}
          </p>
        </div>
        <span className="rounded-full bg-[#eef1e9] px-3 py-1 text-xs font-semibold text-[#46534b]">
          {attendanceRate}% attendance
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Assignments" value={assignmentCount} />
        <MiniStat label="Submissions" value={submissionCount} />
        <MiniStat label="Messages" value={messageCount} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef1e9]">
        <div
          className="h-full rounded-full bg-[#1d6d58]"
          style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
        />
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#f6f7f3] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#778279]">
        {label}
      </p>
      <strong className="mt-1 block text-xl font-semibold text-[#1d6d58]">
        {value}
      </strong>
    </div>
  );
}

function CourseForm({
  onCourseCreate,
}: {
  onCourseCreate: (course: Omit<Course, "id" | "teacher">) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onCourseCreate({
      title: String(form.get("title") || "New course"),
      description: String(form.get("description") || "Course description"),
      meetingLink: String(form.get("meetingLink") || "https://meet.google.com/new-class"),
      enrolled: [],
    });
    event.currentTarget.reset();
  }

  return (
    <Panel title="Create a course" eyebrow="Teacher tool">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Field label="Course title" name="title" placeholder="Robotics Studio" />
        <TextArea
          label="Description"
          name="description"
          placeholder="What students will learn"
        />
        <Field
          label="Google Meet or Zoom link"
          name="meetingLink"
          placeholder="https://meet.google.com/class-room"
          type="url"
        />
        <PrimaryButton>Create course</PrimaryButton>
      </form>
    </Panel>
  );
}

function AssignmentForm({
  courses,
  onAssignmentCreate,
}: {
  courses: Course[];
  onAssignmentCreate: (assignment: Omit<Assignment, "id">) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onAssignmentCreate({
      courseId: Number(form.get("courseId")),
      title: String(form.get("title") || "New assignment"),
      dueDate: String(form.get("dueDate") || "2026-06-01"),
      instructions: String(form.get("instructions") || "Submit your work."),
    });
    event.currentTarget.reset();
  }

  return (
    <Panel title="Create assignment" eyebrow="Post to students">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#46534b]">
            Course
          </span>
          <select
            className="h-11 w-full rounded-md border border-[#cbd3c5] bg-white px-3 text-sm outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
            name="courseId"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <Field label="Assignment title" name="title" placeholder="Lab report" />
        <Field label="Due date" name="dueDate" type="date" />
        <TextArea
          label="Instructions"
          name="instructions"
          placeholder="What students should submit"
        />
        <PrimaryButton>Create assignment</PrimaryButton>
      </form>
    </Panel>
  );
}

function CourseResourceForm({
  courses,
  onCourseResourceCreate,
}: {
  courses: Course[];
  onCourseResourceCreate: (resource: Omit<CourseResource, "id">) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("attachment");
    const attachment =
      file instanceof File && file.size > 0
        ? {
            name: file.name,
            size: file.size,
            type: file.type || "Unknown file type",
            uploadedAt: new Date().toISOString().slice(0, 10),
          }
        : {
            name: "course-material.pdf",
            size: 102400,
            type: "application/pdf",
            uploadedAt: new Date().toISOString().slice(0, 10),
          };

    onCourseResourceCreate({
      courseId: Number(form.get("courseId")),
      title: String(form.get("title") || "Course material"),
      description: String(form.get("description") || "Shared course resource."),
      attachment,
    });
    event.currentTarget.reset();
  }

  return (
    <Panel title="Add course material" eyebrow="Resource library">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#46534b]">
            Course
          </span>
          <select
            className="h-11 w-full rounded-md border border-[#cbd3c5] bg-white px-3 text-sm outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
            name="courseId"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <Field label="Material title" name="title" placeholder="Lecture notes" />
        <TextArea
          label="Description"
          name="description"
          placeholder="What this resource helps students do"
        />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#46534b]">
            Attach file
          </span>
          <input
            className="w-full rounded-md border border-[#cbd3c5] bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#eef1e9] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#1d6d58]"
            name="attachment"
            type="file"
          />
        </label>
        <PrimaryButton>Add material</PrimaryButton>
      </form>
    </Panel>
  );
}

function CourseResourcesPanel({
  courses,
  resources,
  title,
}: {
  courses: Course[];
  resources: CourseResource[];
  title: string;
}) {
  return (
    <Panel title={title} eyebrow={`${resources.length} resources`}>
      <div className="space-y-3">
        {resources.length ? (
          resources.map((resource) => {
            const course = courses.find((item) => item.id === resource.courseId);

            return (
              <article
                className="rounded-md border border-[#d8ddd2] p-4"
                key={resource.id}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-semibold">{resource.title}</h3>
                    <p className="mt-1 text-sm text-[#667068]">
                      {course?.title || "Course"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#46534b]">
                      {resource.description}
                    </p>
                  </div>
                  <a
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#cbd3c5] px-4 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9]"
                    href="#"
                    onClick={(event) => event.preventDefault()}
                  >
                    Download
                  </a>
                </div>
                <FileAttachmentView attachment={resource.attachment} />
              </article>
            );
          })
        ) : (
          <EmptyState text="No course materials yet." />
        )}
      </div>
    </Panel>
  );
}

function LiveSessionForm({
  courses,
  onLiveSessionCreate,
}: {
  courses: Course[];
  onLiveSessionCreate: (session: Omit<LiveSession, "id">) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onLiveSessionCreate({
      courseId: Number(form.get("courseId")),
      title: String(form.get("title") || "Live class"),
      startsAt: String(form.get("startsAt") || "2026-05-22T10:00"),
      link: String(form.get("link") || "https://meet.google.com/class-room"),
    });
    event.currentTarget.reset();
  }

  return (
    <Panel title="Schedule live class" eyebrow="Video session">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#46534b]">
            Course
          </span>
          <select
            className="h-11 w-full rounded-md border border-[#cbd3c5] bg-white px-3 text-sm outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
            name="courseId"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <Field label="Session title" name="title" placeholder="Weekly review" />
        <Field label="Start time" name="startsAt" type="datetime-local" />
        <Field
          label="Google Meet or Zoom link"
          name="link"
          placeholder="https://meet.google.com/class-room"
          type="url"
        />
        <PrimaryButton>Schedule session</PrimaryButton>
      </form>
    </Panel>
  );
}

function LiveSessionsPanel({
  courses,
  liveSessions,
  title,
}: {
  courses: Course[];
  liveSessions: LiveSession[];
  title: string;
}) {
  const sortedSessions = [...liveSessions].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );

  return (
    <Panel title={title} eyebrow={`${liveSessions.length} scheduled`}>
      <div className="space-y-3">
        {sortedSessions.length ? (
          sortedSessions.map((session) => {
            const course = courses.find((item) => item.id === session.courseId);

            return (
              <article
                className="rounded-md border border-[#d8ddd2] p-4"
                key={session.id}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold">{session.title}</h3>
                    <p className="mt-1 text-sm text-[#667068]">
                      {course?.title || "Course"} •{" "}
                      {session.startsAt.replace("T", " ")}
                    </p>
                  </div>
                  <a
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#1d6d58] px-4 text-sm font-semibold text-white transition hover:bg-[#124e40]"
                    href={session.link}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Join Class
                  </a>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState text="No live classes scheduled yet." />
        )}
      </div>
    </Panel>
  );
}

function AttendancePanel({
  attendanceRecords,
  courses,
  onMarkAttendance,
}: {
  attendanceRecords: AttendanceRecord[];
  courses: Course[];
  onMarkAttendance: (
    courseId: number,
    student: string,
    status: AttendanceStatus,
  ) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const enrolledRows = courses.flatMap((course) =>
    course.enrolled.map((student) => ({
      course,
      student,
      todayRecord: attendanceRecords.find(
        (record) =>
          record.courseId === course.id &&
          record.student === student &&
          record.date === today,
      ),
    })),
  );

  return (
    <Panel title="Attendance tracking" eyebrow="Today">
      <div className="space-y-3">
        {enrolledRows.length ? (
          enrolledRows.map(({ course, student, todayRecord }) => (
            <div
              className="rounded-md border border-[#d8ddd2] p-4"
              key={`${course.id}-${student}`}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold">{student}</h3>
                  <p className="mt-1 text-sm text-[#667068]">{course.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {todayRecord ? <StatusPill status={todayRecord.status} /> : null}
                  <button
                    className="h-10 rounded-md bg-[#1d6d58] px-3 text-sm font-semibold text-white transition hover:bg-[#124e40]"
                    onClick={() =>
                      onMarkAttendance(course.id, student, "Present")
                    }
                    type="button"
                  >
                    Present
                  </button>
                  <button
                    className="h-10 rounded-md border border-[#d7bbb5] px-3 text-sm font-semibold text-[#6b342c] transition hover:bg-[#fff2ee]"
                    onClick={() => onMarkAttendance(course.id, student, "Absent")}
                    type="button"
                  >
                    Absent
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="No enrolled students available for attendance." />
        )}
      </div>
    </Panel>
  );
}

function MessagePanel({
  courses,
  messages,
  onMessageSend,
  title,
  user,
}: {
  courses: Course[];
  messages: CourseMessage[];
  onMessageSend: (courseId: number, body: string) => void;
  title: string;
  user: User;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(
    courses[0]?.id?.toString() || "",
  );
  const activeCourseId = Number(selectedCourseId || courses[0]?.id || 0);
  const courseMessages = messages
    .filter((message) => message.courseId === activeCourseId)
    .slice(0, 5);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get("message") || "").trim();

    if (!activeCourseId || !body) {
      return;
    }

    onMessageSend(activeCourseId, body);
    event.currentTarget.reset();
  }

  return (
    <Panel title={title} eyebrow="Messaging">
      {courses.length ? (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#46534b]">
              Course
            </span>
            <select
              className="h-11 w-full rounded-md border border-[#cbd3c5] bg-white px-3 text-sm outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
              onChange={(event) => setSelectedCourseId(event.target.value)}
              value={selectedCourseId || courses[0].id}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            {courseMessages.length ? (
              courseMessages.map((message) => (
                <article
                  className={`rounded-md border p-4 ${
                    message.senderRole === user.role
                      ? "border-[#b8d8cb] bg-[#f1faf5]"
                      : "border-[#d8ddd2] bg-white"
                  }`}
                  key={message.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{message.sender}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#46534b]">
                        {message.body}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#eef1e9] px-3 py-1 text-xs font-semibold text-[#46534b]">
                      {message.senderRole}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#778279]">
                    {message.createdAt}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState text="No messages in this course yet." />
            )}
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <TextArea
              label="New message"
              name="message"
              placeholder="Write a course update or question"
            />
            <PrimaryButton>Send message</PrimaryButton>
          </form>
        </div>
      ) : (
        <EmptyState text="No courses available for messages yet." />
      )}
    </Panel>
  );
}

function AssignmentSubmitCard({
  assignment,
  courseTitle,
  submitted,
  onSubmit,
}: {
  assignment: Assignment;
  courseTitle: string;
  submitted: boolean;
  onSubmit: (
    assignmentId: number,
    response: string,
    attachment?: FileAttachment,
  ) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("attachment");
    const attachment =
      file instanceof File && file.size > 0
        ? {
            name: file.name,
            size: file.size,
            type: file.type || "Unknown file type",
            uploadedAt: new Date().toISOString().slice(0, 10),
          }
        : undefined;

    onSubmit(
      assignment.id,
      String(form.get("response") || "Submitted."),
      attachment,
    );
    event.currentTarget.reset();
  }

  return (
    <div className="rounded-md border border-[#d8ddd2] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{assignment.title}</h3>
          <p className="mt-1 text-sm text-[#667068]">
            {courseTitle} • Due {assignment.dueDate}
          </p>
          <p className="mt-2 text-sm text-[#46534b]">
            {assignment.instructions}
          </p>
        </div>
        <span className="rounded-full bg-[#fff2d7] px-3 py-1 text-xs font-semibold text-[#7a4c00]">
          {submitted ? "Submitted" : "Open"}
        </span>
      </div>
      {!submitted ? (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <TextArea
            label="Your submission"
            name="response"
            placeholder="Paste your answer or project note"
          />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#46534b]">
              Attach file
            </span>
            <input
              className="w-full rounded-md border border-[#cbd3c5] bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#eef1e9] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#1d6d58]"
              name="attachment"
              type="file"
            />
          </label>
          <PrimaryButton>Submit assignment</PrimaryButton>
        </form>
      ) : null}
    </div>
  );
}

function ReviewCard({
  assignmentTitle,
  submission,
  onReview,
}: {
  assignmentTitle: string;
  submission: Submission;
  onReview: (submissionId: number, grade: string, feedback: string) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onReview(
      submission.id,
      String(form.get("grade") || "100%"),
      String(form.get("feedback") || "Reviewed."),
    );
  }

  return (
    <div className="rounded-md border border-[#d8ddd2] p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h3 className="font-semibold">{assignmentTitle}</h3>
          <p className="mt-1 text-sm text-[#667068]">{submission.student}</p>
          <p className="mt-3 rounded-md bg-[#f6f7f3] p-3 text-sm text-[#46534b]">
            {submission.response}
          </p>
          {submission.attachment ? (
            <FileAttachmentView attachment={submission.attachment} />
          ) : null}
        </div>
        <span className="h-fit rounded-full bg-[#e1f1ea] px-3 py-1 text-xs font-semibold text-[#1d6d58]">
          {submission.status}
        </span>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-[120px_1fr_auto]" onSubmit={handleSubmit}>
        <Field
          defaultValue={submission.grade || ""}
          label="Grade"
          name="grade"
          placeholder="95%"
        />
        <Field
          defaultValue={submission.feedback || ""}
          label="Feedback"
          name="feedback"
          placeholder="Helpful, concise feedback"
        />
        <div className="flex items-end">
          <PrimaryButton>Review</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function CourseCard({
  course,
  enrolled,
  onEnroll,
}: {
  course: Course;
  enrolled: boolean;
  onEnroll?: () => void;
}) {
  return (
    <article className="rounded-md border border-[#d8ddd2] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{course.title}</h3>
          <p className="mt-1 text-sm text-[#667068]">Teacher: {course.teacher}</p>
        </div>
        <span className="rounded-full bg-[#eef1e9] px-3 py-1 text-xs font-semibold text-[#46534b]">
          {course.enrolled.length} enrolled
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#46534b]">{course.description}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#1d6d58] px-4 text-sm font-semibold text-white transition hover:bg-[#124e40]"
          href={course.meetingLink}
          rel="noreferrer"
          target="_blank"
        >
          Join Class
        </a>
        {onEnroll ? (
          <button
            className="h-10 rounded-md border border-[#cbd3c5] px-4 text-sm font-semibold text-[#17211b] transition hover:bg-[#eef1e9] disabled:cursor-not-allowed disabled:opacity-55"
            disabled={enrolled}
            onClick={onEnroll}
            type="button"
          >
            {enrolled ? "Enrolled" : "Enroll"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function FileAttachmentView({ attachment }: { attachment: FileAttachment }) {
  return (
    <div className="mt-3 rounded-md border border-[#d8ddd2] bg-[#fbfcf8] p-3 text-sm">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-[#17211b]">{attachment.name}</p>
          <p className="mt-1 text-[#667068]">
            {attachment.type} • {formatFileSize(attachment.size)}
          </p>
        </div>
        <span className="rounded-full bg-[#eef1e9] px-3 py-1 text-xs font-semibold text-[#46534b]">
          Uploaded {attachment.uploadedAt}
        </span>
      </div>
    </div>
  );
}

function Panel({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#d8ddd2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#778279]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Metric({
  compact,
  label,
  suffix = "",
  value,
}: {
  compact?: boolean;
  label: string;
  suffix?: string;
  value: number;
}) {
  return (
    <div
      className={`rounded-lg border border-[#d8ddd2] bg-white shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <p className="text-sm font-semibold text-[#667068]">{label}</p>
      <strong className="mt-2 block text-4xl font-semibold text-[#1d6d58]">
        {value}
        {suffix}
      </strong>
    </div>
  );
}

function StatusPill({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        status === "Present"
          ? "bg-[#e1f1ea] text-[#1d6d58]"
          : "bg-[#fff2ee] text-[#6b342c]"
      }`}
    >
      {status}
    </span>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[#46534b]">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-md border border-[#cbd3c5] bg-white px-3 text-sm outline-none transition placeholder:text-[#9aa49d] focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[#46534b]">
        {label}
      </span>
      <textarea
        className="min-h-24 w-full resize-y rounded-md border border-[#cbd3c5] bg-white px-3 py-2 text-sm outline-none transition placeholder:text-[#9aa49d] focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="h-11 rounded-md bg-[#1d6d58] px-4 text-sm font-semibold text-white transition hover:bg-[#124e40]"
      type="submit"
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#cbd3c5] p-5 text-sm text-[#667068]">
      {text}
    </div>
  );
}
