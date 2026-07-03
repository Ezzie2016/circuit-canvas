"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: string;
  submissionCount?: number;
};

type Submission = {
  assignmentId: string;
  status: string;
};

export default function TeacherSubmissionsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [assignRes, subRes] = await Promise.all([
          fetch("/api/assignments"),
          fetch("/api/submissions"),
        ]);
        const assignData: Assignment[] = await assignRes.json();
        const subData: Submission[] = subRes.ok ? await subRes.json() : [];

        const countMap: Record<string, number> = {};
        subData.forEach((s) => {
          countMap[s.assignmentId] = (countMap[s.assignmentId] || 0) + 1;
        });

        setAssignments(
          assignData.map((a) => ({ ...a, submissionCount: countMap[a.id] || 0 }))
        );
      } catch (err) {
        console.error("Failed to load submissions:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  const pending = assignments.filter((a) => (a.submissionCount ?? 0) > 0);
  const empty = assignments.filter((a) => (a.submissionCount ?? 0) === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Submissions</h1>
        <p className="mt-2 text-slate-600">Monitor assignment submissions and grade the work that needs your attention.</p>
      </div>

      {assignments.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-slate-500">No assignments yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Needs Grading</h2>
          {pending.map((assignment) => (
            <div key={assignment.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{assignment.course}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{assignment.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">Due: {assignment.dueDate}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-xl bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    {assignment.submissionCount} submission{assignment.submissionCount !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/teacher/assignments/${assignment.id}`}
                    className="rounded-xl bg-[#1d6d58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124e40] transition"
                  >
                    Grade →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {empty.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">No Submissions Yet</h2>
          {empty.map((assignment) => (
            <div key={assignment.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm opacity-70">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{assignment.course}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{assignment.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">Due: {assignment.dueDate}</p>
                </div>
                <Link
                  href={`/teacher/assignments/${assignment.id}`}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
