// app/(dashboard)/student/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  students: number;
  status: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseId: string;
  dueDate: string;
  status: string;
  submissionCount: number;
}

interface Submission {
  id: string;
  assignmentTitle: string;
  courseName: string;
  grade: string | null;
  status: string;
  createdAt: string;
}

interface LiveSession {
  id: string;
  title: string;
  course: string;
  start: string;
  link: string;
}

interface Analytics {
  enrolledCourses: number;
  pendingAssignments: number;
  submittedAssignments: number;
  totalAssignments: number;
  averageCompletion: number;
  attendanceRate: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
      if (data.user.role !== "STUDENT") {
        router.push(`/${data.user.role.toLowerCase()}`);
        return;
      }

      setUser(data.user);

      const [coursesRes, assignmentsRes, submissionsRes, liveRes, analyticsRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/assignments"),
        fetch("/api/submissions"),
        fetch("/api/live"),
        fetch("/api/analytics"),
      ]);

      const [coursesData, assignmentsData, submissionsData, liveData, analyticsData] = await Promise.all([
        coursesRes.json(),
        assignmentsRes.json(),
        submissionsRes.json(),
        liveRes.json(),
        analyticsRes.json(),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setLiveSessions(Array.isArray(liveData) ? liveData : []);
      setAnalytics(analyticsData?.enrolledCourses !== undefined ? analyticsData : null);

      const notifRes = await fetch(`/api/notifications?role=STUDENT&userId=${data.user.id}`);
      const notifData = await notifRes.json();
      setNotifications(Array.isArray(notifData) ? notifData.slice(0, 8) : []);

      setLoading(false);
    }

    loadSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  const upcomingSessions = liveSessions.filter((session) => new Date(session.start) > new Date()).length;
  const averageGrade =
    submissions.length > 0
      ? Math.round(
          submissions
            .filter((s) => s.grade)
            .reduce((sum, s) => sum + parseInt(s.grade || "0"), 0) / submissions.filter((s) => s.grade).length
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Student dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Good day, {user.name}</h1>
            <p className="mt-1 text-sm text-slate-600">Your assignments, courses, grades, and live sessions are all here.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold">{user.email}</p>
            <p className="mt-1 text-slate-500">Student account</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Enrolled Courses</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.enrolledCourses || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Pending Assignments</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.pendingAssignments || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Average Grade</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{averageGrade || "-"}%</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Attendance</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.attendanceRate || 0}%</p>
          </div>
        </div>

        {/* Courses & Assignments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#1d6d58] mb-4">My Courses</h2>
            <ul className="space-y-3">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <li key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                    <div>
                      <span className="font-semibold">{course.title}</span>
                      <p className="text-xs text-gray-500">{course.instructor}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{course.students} students</span>
                  </li>
                ))
              ) : (
                <li className="p-3 bg-gray-50 rounded text-gray-600">No course enrollments found yet.</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Pending Assignments</h2>
            <ul className="space-y-3">
              {assignments.filter((a) => a.status === "Pending").length > 0 ? (
                assignments
                  .filter((a) => a.status === "Pending")
                  .slice(0, 5)
                  .map((assignment) => (
                    <li key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold text-sm">{assignment.title}</p>
                        <p className="text-xs text-gray-500">Due: {assignment.dueDate}</p>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Pending</span>
                    </li>
                  ))
              ) : (
                <li className="p-3 bg-gray-50 rounded text-gray-600">All assignments submitted!</li>
              )}
            </ul>
          </div>
        </div>

        {/* Grades */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Your Grades</h2>
          {submissions.filter((s) => s.grade).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Assignment</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .filter((s) => s.grade)
                    .map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{sub.assignmentTitle}</td>
                        <td className="px-4 py-3">{sub.courseName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${parseInt(sub.grade || "0") >= 70 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {sub.grade}%
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(sub.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No grades yet. Complete and submit assignments to receive grades from your teachers.</p>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Overall Attendance Rate</p>
              <p className="text-2xl font-bold text-[#1d6d58]">{analytics?.attendanceRate || 0}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Upcoming Live Sessions</p>
              <p className="text-2xl font-bold text-[#1d6d58]">{upcomingSessions}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Link href="/student/attendance-history">
              <button className="bg-[#1d6d58] text-white py-2 px-4 rounded font-semibold hover:bg-[#124e40]">
                View Attendance History
              </button>
            </Link>
            <Link href="/student/live-sessions">
              <button className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700">
                Join Live Session
              </button>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Notifications</h2>
          {notifications.length > 0 ? (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#1d6d58]" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No notifications yet.</p>
          )}
        </div>

        {/* Upcoming Live Sessions */}
        {upcomingSessions > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
            <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Upcoming Live Sessions</h2>
            <ul className="space-y-3">
              {liveSessions
                .filter((s) => new Date(s.start) > new Date())
                .map((session) => (
                  <li key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {session.course} • {new Date(session.start).toLocaleString()}
                      </p>
                    </div>
                    <a
                      href={session.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1d6d58] text-white px-4 py-2 rounded text-sm hover:bg-[#124e40]"
                    >
                      Join
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6">
          <p className="text-sm text-slate-500">© 2026 Circuit Campus. All rights reserved.</p>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </footer>
    </div>
  );
}