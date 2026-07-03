"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CoursePerformance {
  courseId: string;
  courseName: string;
  totalStudents: number;
  averageGrade: number;
  submitRate: number;
  attendanceRate: number;
}

export default function ClassPerformancePage() {
  const [courses, setCourses] = useState<CoursePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPerformance() {
      try {
        const response = await fetch("/api/analytics");
        if (response.ok) {
          const analyticsData = await response.json();
          setCourses(analyticsData.courseStats || []);
        }
      } catch (error) {
        console.error("Failed to load performance:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-500">Loading performance data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher" className="text-sm font-medium text-[#1d6d58] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Class Performance Analytics</h1>
        <p className="mt-2 text-slate-600">Submission rates, grades, and attendance across your courses.</p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-slate-500">No course data available yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <div key={course.courseId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-5">{course.courseName}</h2>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-slate-900">{course.totalStudents}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-600 mb-1">Avg Grade</p>
                  <p className="text-2xl font-bold text-blue-700">{course.averageGrade}%</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600 mb-1">Submission Rate</p>
                  <p className="text-2xl font-bold text-emerald-700">{course.submitRate}%</p>
                </div>
                <div className="rounded-2xl bg-purple-50 p-4">
                  <p className="text-xs text-purple-600 mb-1">Attendance Rate</p>
                  <p className="text-2xl font-bold text-purple-700">{course.attendanceRate}%</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-700">Submission Rate</p>
                    <p className="text-sm font-semibold text-emerald-700">{course.submitRate}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${course.submitRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-700">Attendance Rate</p>
                    <p className="text-sm font-semibold text-blue-700">{course.attendanceRate}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${course.attendanceRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
