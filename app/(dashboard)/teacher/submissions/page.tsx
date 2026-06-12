"use client";

import { useEffect, useState } from "react";

type Assignment = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: string;
};

export default function TeacherSubmissionsPage() {
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
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Submissions</h1>
        <p className="mt-2 text-slate-600">Monitor assignment submissions and grade the work that needs your attention.</p>
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
            <p className="mt-4 text-sm text-slate-600">Due date: {assignment.dueDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
