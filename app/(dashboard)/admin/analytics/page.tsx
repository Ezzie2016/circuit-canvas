"use client";

import { useEffect, useState } from "react";

type Teacher = {
  id: string;
  name: string;
  email: string;
};

type Analytics = {
  totalCourses: number;
  totalStudents: number;
  averageCompletion: number;
  pendingAssignments: number;
  totalAssignments: number;
  submittedCount: number;
  reviewedCount: number;
  averageAttendance?: number;
  upcomingSessions?: number;
  courseStats?: Array<{
    courseId: string;
    courseName: string;
    totalStudents: number;
    averageGrade: number;
    submitRate: number;
    attendanceRate: number;
  }>;
};

const cards: Array<{ label: string; key: keyof Analytics; suffix?: string }> = [
  { label: "Total Courses", key: "totalCourses" },
  { label: "Total Students", key: "totalStudents" },
  { label: "Avg Completion", key: "averageCompletion", suffix: "%" },
  { label: "Pending Assignments", key: "pendingAssignments" },
  { label: "Total Assignments", key: "totalAssignments" },
  { label: "Submitted", key: "submittedCount" },
];

export default function AdminAnalyticsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Load teachers on mount
  useEffect(() => {
    async function loadTeachers() {
      try {
        const response = await fetch("/api/admin/teachers");
        const data = await response.json();
        setTeachers(data);
        if (data.length > 0) {
          setSelectedTeacherId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load teachers:", error);
      }
    }
    loadTeachers();
  }, []);

  // Load analytics when teacher is selected
  useEffect(() => {
    if (!selectedTeacherId) return;

    async function loadMetrics() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?teacherId=${selectedTeacherId}`);
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [selectedTeacherId]);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-2 text-slate-600">Per-teacher performance and operational metrics.</p>
      </div>

      {/* Teacher Selector */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-3">Select Teacher</label>
        <select
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d6d58]"
        >
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name} ({teacher.email})
            </option>
          ))}
        </select>
      </div>

      {/* Analytics Cards */}
      {selectedTeacher && (
        <>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{selectedTeacher.name} - Overview</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.key} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-4 text-4xl font-semibold text-[#1d6d58]">
                  {loading ? "—" : analytics ? `${analytics[card.key]}${card.suffix ?? ""}` : "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Course Stats Table */}
          {analytics && analytics.courseStats && analytics.courseStats.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Course Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Course</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Students</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Avg Grade</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Submit Rate</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.courseStats.map((course) => (
                      <tr key={course.courseId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-900">{course.courseName}</td>
                        <td className="py-3 px-4 text-center text-slate-700">{course.totalStudents}</td>
                        <td className="py-3 px-4 text-center text-slate-700">{course.averageGrade}%</td>
                        <td className="py-3 px-4 text-center text-slate-700">{course.submitRate}%</td>
                        <td className="py-3 px-4 text-center text-slate-700">{course.attendanceRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Insights</h2>
            <p className="mt-3 text-slate-600">Monitor {selectedTeacher.name}&apos;s class engagement, submission rates, and attendance patterns. Use this data to identify students needing support and to plan course adjustments.</p>
          </div>
        </>
      )}
    </div>
  );
}
