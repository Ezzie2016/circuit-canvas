"use client";

import { useEffect, useState } from "react";

type Person = { id: string; name: string; email: string; role: string };

type TeacherAnalytics = {
  totalCourses: number;
  totalStudents: number;
  averageCompletion: number;
  pendingAssignments: number;
  totalAssignments: number;
  submittedCount: number;
  reviewedCount: number;
  courseStats?: Array<{
    courseId: string;
    courseName: string;
    totalStudents: number;
    averageGrade: number;
    submitRate: number;
    attendanceRate: number;
  }>;
};

type StudentAnalytics = {
  enrolledCourses: number;
  totalAssignments: number;
  submittedCount: number;
  pendingAssignments: number;
  avgGrade: number | null;
  attendanceRate: number;
  courseStats?: Array<{
    courseId: string;
    courseName: string;
    teacherName: string;
    totalAssignments: number;
    submitted: number;
    avgGrade: number | null;
    attendanceRate: number;
  }>;
};

type Tab = "teachers" | "students";

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState<Tab>("teachers");
  const [users, setUsers] = useState<Person[]>([]);

  // Teacher tab state
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherAnalytics, setTeacherAnalytics] = useState<TeacherAnalytics | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(false);

  // Student tab state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Load all users once
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        const firstTeacher = data.find((u: Person) => u.role === "TEACHER");
        if (firstTeacher) setSelectedTeacherId(firstTeacher.id);
        const firstStudent = data.find((u: Person) => u.role === "STUDENT");
        if (firstStudent) setSelectedStudentId(firstStudent.id);
      }
    }
    load();
  }, []);

  // Load teacher analytics
  useEffect(() => {
    if (!selectedTeacherId) return;
    setTeacherLoading(true);
    fetch(`/api/analytics?teacherId=${selectedTeacherId}`)
      .then((r) => r.json())
      .then((d) => setTeacherAnalytics(d))
      .finally(() => setTeacherLoading(false));
  }, [selectedTeacherId]);

  // Load student analytics
  useEffect(() => {
    if (!selectedStudentId) return;
    setStudentLoading(true);
    fetch(`/api/analytics?studentId=${selectedStudentId}`)
      .then((r) => r.json())
      .then((d) => setStudentAnalytics(d))
      .finally(() => setStudentLoading(false));
  }, [selectedStudentId]);

  const teachers = users.filter((u) => u.role === "TEACHER");
  const students = users.filter((u) => u.role === "STUDENT");

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-2 text-slate-600">View performance metrics for individual teachers and students.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
        {(["teachers", "students"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize transition ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TEACHER TAB ── */}
      {tab === "teachers" && (
        <div className="space-y-6">
          {teachers.length === 0 ? (
            <p className="text-slate-500">No teachers found.</p>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-3">Select Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d6d58]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              {selectedTeacher && (
                <>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedTeacher.name} — Overview</h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      { label: "Courses", value: teacherAnalytics?.totalCourses },
                      { label: "Total Students", value: teacherAnalytics?.totalStudents },
                      { label: "Avg Completion", value: teacherAnalytics?.averageCompletion, suffix: "%" },
                      { label: "Pending Assignments", value: teacherAnalytics?.pendingAssignments },
                      { label: "Total Assignments", value: teacherAnalytics?.totalAssignments },
                      { label: "Submissions Graded", value: teacherAnalytics?.reviewedCount },
                    ].map((card) => (
                      <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">{card.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-[#1d6d58]">
                          {teacherLoading ? "—" : card.value != null ? `${card.value}${card.suffix ?? ""}` : "—"}
                        </p>
                      </div>
                    ))}
                  </div>

                  {teacherAnalytics?.courseStats && teacherAnalytics.courseStats.length > 0 && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-slate-900 mb-4">Course Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left">
                              <th className="py-3 px-4 font-semibold text-slate-600">Course</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Students</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Avg Grade</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Submit Rate</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Attendance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherAnalytics.courseStats.map((c) => (
                              <tr key={c.courseId} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">{c.courseName}</td>
                                <td className="py-3 px-4 text-center">{c.totalStudents}</td>
                                <td className="py-3 px-4 text-center">{c.averageGrade}%</td>
                                <td className="py-3 px-4 text-center">{c.submitRate}%</td>
                                <td className="py-3 px-4 text-center">{c.attendanceRate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── STUDENT TAB ── */}
      {tab === "students" && (
        <div className="space-y-6">
          {students.length === 0 ? (
            <p className="text-slate-500">No students found.</p>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-3">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d6d58]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedStudent.name} — Overview</h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      { label: "Enrolled Courses", value: studentAnalytics?.enrolledCourses },
                      { label: "Assignments Submitted", value: studentAnalytics?.submittedCount },
                      { label: "Pending Assignments", value: studentAnalytics?.pendingAssignments },
                      { label: "Average Grade", value: studentAnalytics?.avgGrade, suffix: "%", fallback: "N/A" },
                      { label: "Attendance Rate", value: studentAnalytics?.attendanceRate, suffix: "%" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">{card.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-[#1d6d58]">
                          {studentLoading
                            ? "—"
                            : card.value != null
                            ? `${card.value}${card.suffix ?? ""}`
                            : (card.fallback ?? "—")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {studentAnalytics?.courseStats && studentAnalytics.courseStats.length > 0 && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-slate-900 mb-4">Course Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left">
                              <th className="py-3 px-4 font-semibold text-slate-600">Course</th>
                              <th className="py-3 px-4 font-semibold text-slate-600">Teacher</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Submitted</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Avg Grade</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Attendance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentAnalytics.courseStats.map((c) => (
                              <tr key={c.courseId} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">{c.courseName}</td>
                                <td className="py-3 px-4 text-slate-500">{c.teacherName}</td>
                                <td className="py-3 px-4 text-center">
                                  {c.submitted}/{c.totalAssignments}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {c.avgGrade != null ? (
                                    <span className={`font-semibold ${c.avgGrade >= 50 ? "text-emerald-600" : "text-red-500"}`}>
                                      {c.avgGrade}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">{c.attendanceRate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {studentAnalytics?.courseStats?.length === 0 && (
                    <p className="text-slate-500 text-sm">This student is not enrolled in any courses yet.</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
