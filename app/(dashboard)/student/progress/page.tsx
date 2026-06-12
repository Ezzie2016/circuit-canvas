"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Analytics {
  enrolledCourses: number;
  pendingAssignments: number;
  submittedAssignments: number;
  totalAssignments: number;
  averageCompletion: number;
  attendanceRate: number;
}

interface Submission {
  id: string;
  status: string;
  grade: string | null;
  createdAt: string;
  assignmentTitle: string;
  courseName: string;
  assignmentDueDate: string | null;
}

export default function StudentProgressPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      try {
        const [analyticsRes, submissionsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/submissions"),
        ]);

        const [analyticsData, submissionsData] = await Promise.all([
          analyticsRes.json(),
          submissionsRes.json(),
        ]);

        if (!analyticsRes.ok) {
          setError(analyticsData.error || "Unable to load progress metrics.");
          setLoading(false);
          return;
        }

        if (!submissionsRes.ok) {
          setError(submissionsData.error || "Unable to load submissions data.");
          setLoading(false);
          return;
        }

        setAnalytics(analyticsData);
        setSubmissions(submissionsData);
      } catch (err) {
        console.error("Failed to load student progress:", err);
        setError("Something went wrong while loading your progress.");
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  const submittedOnTime = submissions.filter((submission) => {
    if (!submission.assignmentDueDate || !submission.createdAt) {
      return false;
    }
    return new Date(submission.createdAt) <= new Date(submission.assignmentDueDate);
  }).length;

  const submittedCount = submissions.filter((submission) => submission.status === "SUBMITTED" || submission.status === "REVIEWED").length;
  const onTimeRate = submittedCount > 0 ? Math.round((submittedOnTime / submittedCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Progress</h1>
        <p className="mt-2 text-slate-600">Track your learning progress and milestone performance in real time.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">Loading progress metrics...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Course completion</p>
            <p className="mt-4 text-4xl font-semibold text-[#1d6d58]">{analytics?.averageCompletion ?? 0}%</p>
            <p className="mt-2 text-sm text-slate-500">Based on assignments across your enrolled courses.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">On-time submissions</p>
            <p className="mt-4 text-4xl font-semibold text-[#1d6d58]">{onTimeRate}%</p>
            <p className="mt-2 text-sm text-slate-500">Submissions completed by due date.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Attendance rate</p>
            <p className="mt-4 text-4xl font-semibold text-[#1d6d58]">{analytics?.attendanceRate ?? 0}%</p>
            <p className="mt-2 text-sm text-slate-500">Latest attendance from your enrolled classes.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pending assignments</p>
            <p className="mt-4 text-4xl font-semibold text-[#1d6d58]">{analytics?.pendingAssignments ?? 0}</p>
            <p className="mt-2 text-sm text-slate-500">Assignments not yet submitted.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent submissions</h2>
            <p className="mt-1 text-sm text-slate-600">Review your latest work and status updates.</p>
          </div>
          <Link href="/student/assignments" className="text-sm font-semibold text-[#1d6d58] hover:text-[#124e40]">
            See assignments
          </Link>
        </div>

        {submissions.length === 0 ? (
          <p className="text-slate-600">No submissions yet. Submit your assignments to track progress here.</p>
        ) : (
          <div className="grid gap-3">
            {submissions.slice(0, 5).map((submission) => (
              <div key={submission.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{submission.assignmentTitle}</p>
                    <p className="text-sm text-slate-500">{submission.courseName}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{submission.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Grade: {submission.grade ?? "Pending"}</span>
                  <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                  {submission.assignmentDueDate ? <span>Due: {submission.assignmentDueDate}</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
