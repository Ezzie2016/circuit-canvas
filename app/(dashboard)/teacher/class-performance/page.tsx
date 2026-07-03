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
          const performance = analyticsData.courseStats || [];
          setCourses(performance);
        } else {
          const errorData = await response.json();
          console.error("Failed to load performance:", errorData);
        }
      } catch (error) {
        console.error("Failed to load performance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPerformance();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/teacher" className="text-[#1d6d58] hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1d6d58] mb-8">Class Performance Analytics</h1>

        <div className="grid grid-cols-1 gap-6">
          {courses.map((course) => (
            <div key={course.courseId} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-[#1d6d58] mb-4">{course.courseName}</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-gray-500 text-sm mb-1">Total Students</div>
                  <div className="text-2xl font-bold text-[#1d6d58]">{course.totalStudents}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm mb-1">Avg Grade</div>
                  <div className="text-2xl font-bold text-blue-600">{course.averageGrade}%</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm mb-1">Submission Rate</div>
                  <div className="text-2xl font-bold text-green-600">{course.submitRate}%</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm mb-1">Attendance Rate</div>
                  <div className="text-2xl font-bold text-purple-600">{course.attendanceRate}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Submission Rate</div>
                  <div className="bg-gray-200 rounded-xl h-2 overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: `${course.submitRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Attendance Rate</div>
                  <div className="bg-gray-200 rounded-xl h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${course.attendanceRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
