// app/(dashboard)/teacher/page.tsx
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
  instructorEmail: string;
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
  studentName: string;
  assignmentTitle: string;
  courseName: string;
  status: string;
  createdAt: string;
}

interface Analytics {
  totalCourses: number;
  totalStudents: number;
  pendingAssignments: number;
  averageCompletion: number;
  upcomingSessions: number;
}

interface LiveSession {
  id: string;
  title: string;
  course: string;
  start: string;
  link: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
      if (data.user.role !== "TEACHER") {
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
      setAnalytics(analyticsData?.totalCourses !== undefined ? analyticsData : null);
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

  const pendingSubmissions = submissions.filter((s) => s.status !== "REVIEWED").length;
  const upcomingSessions = liveSessions.filter((s) => new Date(s.start) > new Date()).length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Teacher dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Good day, {user.name}</h1>
            <p className="mt-1 text-sm text-slate-600">Manage courses, assignments, submissions, and live sessions from one place.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold">{user.email}</p>
            <p className="mt-1 text-slate-500">Teacher account</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Total Courses</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.totalCourses || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Total Students</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.totalStudents || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Pending Grades</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{pendingSubmissions}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Upcoming Sessions</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{upcomingSessions}</p>
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
                      <p className="text-xs text-gray-500">{course.students} students</p>
                    </div>
                    <Link href={`/teacher/courses/${course.id}`}>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">View</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="p-3 bg-gray-50 rounded text-gray-600">You have no courses yet.</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Pending Submissions</h2>
            <ul className="space-y-3">
              {submissions.filter((s) => s.status !== "REVIEWED").length > 0 ? (
                submissions
                  .filter((s) => s.status !== "REVIEWED")
                  .slice(0, 5)
                  .map((submission) => (
                    <li key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold text-sm">{submission.studentName}</p>
                        <p className="text-xs text-gray-500">{submission.assignmentTitle}</p>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Grade</span>
                    </li>
                  ))
              ) : (
                <li className="p-3 bg-gray-50 rounded text-gray-600">All submissions graded!</li>
              )}
            </ul>
          </div>
        </div>

        {/* Grading Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Recent Submissions to Grade</h2>
          {submissions.filter((s) => s.status !== "REVIEWED").length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Student</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Assignment</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Submitted</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .filter((s) => s.status !== "REVIEWED")
                    .slice(0, 10)
                    .map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{sub.studentName}</td>
                        <td className="px-4 py-3">{sub.assignmentTitle}</td>
                        <td className="px-4 py-3">{sub.courseName}</td>
                        <td className="px-4 py-3">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button className="bg-[#1d6d58] text-white px-3 py-1 rounded text-xs hover:bg-[#124e40]">
                            Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No pending submissions. All assignments have been graded!</p>
          )}
        </div>

        {/* Class Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Class Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Average Completion</p>
              <p className="text-2xl font-bold text-[#1d6d58]">{analytics?.averageCompletion || 0}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Assignments</p>
              <p className="text-2xl font-bold text-[#1d6d58]">{assignments.length}</p>
            </div>
            <Link href="/teacher/class-performance">
              <button className="bg-[#1d6d58] text-white py-2 px-4 rounded font-semibold hover:bg-[#124e40]">
                View Detailed Analytics
              </button>
            </Link>
          </div>
        </div>

        {/* Upcoming Live Sessions */}
        {upcomingSessions > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1d6d58]">Upcoming Live Sessions</h2>
              <Link href="/teacher/live-sessions" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                View All →
              </Link>
            </div>
            <ul className="space-y-3">
              {liveSessions
                .filter((s) => new Date(s.start) > new Date())
                .slice(0, 3)
                .map((session) => (
                  <li key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {session.course} • {new Date(session.start).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={session.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#1d6d58] text-white px-3 py-1 rounded text-xs hover:bg-[#124e40]"
                      >
                        Join
                      </a>
                      <Link
                        href={`/teacher/live-sessions/${session.id}/attendance`}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Attendance
                      </Link>
                    </div>
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