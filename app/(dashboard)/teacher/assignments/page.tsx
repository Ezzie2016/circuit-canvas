"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type Assignment = {
  id: number;
  title: string;
  course: string;
  courseId: string;
  dueDate: string;
  status: string;
  submissionCount?: number;
};

const POLL_INTERVAL_MS = 15_000;

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      const response = await fetch("/api/assignments");
      const data = await response.json();
      setAssignments(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssignments();
  }, [loadAssignments]);

  // Poll for new submissions every 15 seconds
  useEffect(() => {
    const interval = setInterval(loadAssignments, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadAssignments]);

  const pendingAssignments = assignments.filter((a) => a.status !== "Submitted");
  const submittedAssignments = assignments.filter((a) => a.status === "Submitted");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#1d6d58] border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Assignments</h1>
          <p className="mt-2 text-slate-600">
            Manage coursework and track student submissions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live</span>
          {lastUpdated && (
            <span>· {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{assignments.length}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm text-orange-700">Pending</p>
          <p className="mt-1 text-3xl font-bold text-orange-600">{pendingAssignments.length}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-700">Submitted</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {assignments.reduce((sum, a) => sum + (a.submissionCount || 0), 0)}
          </p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-xl font-semibold text-slate-700">No assignments yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Create your first assignment to get started.
          </p>
          <Link
            href="/teacher/assignments/create"
            className="mt-6 inline-flex items-center rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#124e40]"
          >
            Create assignment
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingAssignments.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-600">
                Active ({pendingAssignments.length})
              </h2>
              <div className="grid gap-3">
                {pendingAssignments.map((assignment) => (
                  <TeacherAssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            </section>
          )}
          {submittedAssignments.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
                With Submissions ({submittedAssignments.length})
              </h2>
              <div className="grid gap-3">
                {submittedAssignments.map((assignment) => (
                  <TeacherAssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TeacherAssignmentCard({ assignment }: { assignment: Assignment }) {
  const isOverdue = new Date(assignment.dueDate) < new Date();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500">{assignment.course}</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{assignment.title}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(assignment.submissionCount || 0) > 0 && (
            <span className="rounded-xl bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {assignment.submissionCount} submission{assignment.submissionCount === 1 ? "" : "s"}
            </span>
          )}
          <span
            className={`rounded-xl px-3 py-1 text-sm font-semibold ${
              assignment.status === "Submitted"
                ? "bg-emerald-100 text-emerald-700"
                : isOverdue
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {assignment.status === "Submitted" ? "Has submissions" : isOverdue ? "Overdue" : "Active"}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Due: <span className={`font-medium ${isOverdue ? "text-red-600" : "text-slate-700"}`}>{assignment.dueDate}</span>
        </span>
        <Link
          href={`/teacher/assignments/${assignment.id}`}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1d6d58] hover:text-[#1d6d58] transition"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}
