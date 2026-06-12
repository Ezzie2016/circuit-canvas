"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    async function loadStudents() {
      const response = await fetch("/api/teacher/students");
      const data: User[] = await response.json();
      if (response.ok) {
        setStudents(data);
      } else {
        setStudents([]);
      }
    }
    loadStudents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Students</h1>
        <p className="mt-2 text-slate-600">Browse the students assigned to your courses.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {students.map((student) => (
          <div key={student.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{student.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{student.email}</p>
            <p className="mt-4 rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">Student</p>
          </div>
        ))}
      </div>
    </div>
  );
}
