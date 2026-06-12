"use client";

import { useEffect, useState } from "react";

interface Submission {
  id: string;
  assignmentTitle: string;
  courseName: string;
  grade: string | null;
  status: string;
  createdAt: string;
}

interface CourseGrade {
  course: string;
  averageGrade: number;
  gradedAssignments: number;
}

export default function StudentGradesPage() {
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([]);
  const [overallAverage, setOverallAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGrades() {
      try {
        const response = await fetch("/api/submissions");
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Unable to load grade data.");
          setLoading(false);
          return;
        }

        const submissions: Submission[] = data;
        const gradedSubmissions = submissions.filter((submission) => submission.grade);

        if (gradedSubmissions.length === 0) {
          setCourseGrades([]);
          setOverallAverage(null);
          setLoading(false);
          return;
        }

        const grouped = gradedSubmissions.reduce<Record<string, { total: number; count: number }>>((acc, submission) => {
          const score = parseInt(submission.grade || "0", 10);
          if (!Number.isNaN(score)) {
            if (!acc[submission.courseName]) {
              acc[submission.courseName] = { total: 0, count: 0 };
            }
            acc[submission.courseName].total += score;
            acc[submission.courseName].count += 1;
          }
          return acc;
        }, {});

        const computedGrades = Object.entries(grouped).map(([course, summary]) => ({
          course,
          averageGrade: Math.round(summary.total / summary.count),
          gradedAssignments: summary.count,
        }));

        const averageGrade = Math.round(
          gradedSubmissions.reduce((sum, submission) => sum + parseInt(submission.grade || "0", 10), 0) /
            gradedSubmissions.length
        );

        setCourseGrades(computedGrades);
        setOverallAverage(averageGrade);
      } catch (err) {
        console.error("Failed to load grades:", err);
        setError("Something went wrong while loading grades.");
      } finally {
        setLoading(false);
      }
    }

    loadGrades();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Grades</h1>
        <p className="mt-2 text-slate-600">See your actual grade performance across your enrolled courses.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">Loading grades...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : courseGrades.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">
          No graded assignments yet. Submit work and check back for your real-time grade report.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Overall average</p>
              <p className="mt-4 text-4xl font-semibold text-[#1d6d58]">{overallAverage}%</p>
            </div>
            {courseGrades.map((item) => (
              <div key={item.course} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">{item.course}</p>
                <p className="mt-4 text-4xl font-semibold text-[#1d6d58]">{item.averageGrade}%</p>
                <p className="mt-2 text-sm text-slate-500">{item.gradedAssignments} graded assignment{item.gradedAssignments !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
