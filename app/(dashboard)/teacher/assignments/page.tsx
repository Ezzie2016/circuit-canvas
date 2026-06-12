"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Assignment = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: string;
};

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    async function loadAssignments() {
      const response = await fetch("/api/assignments");
      const data = await response.json();
      setAssignments(data);
    }
    loadAssignments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Assignments</h1>
          <p className="mt-2 text-slate-600">Review assigned coursework and pending teacher actions.</p>
        </div>
        <Link
          href="/teacher/assignments/create"
          className="inline-flex items-center justify-center rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#124e40]"
        >
          Create assignment
        </Link>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">{assignment.course}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{assignment.title}</h2>
              </div>
              <span className={`rounded-xl px-3 py-1 text-sm font-semibold ${assignment.status === "Submitted" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                {assignment.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Due: {assignment.dueDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
