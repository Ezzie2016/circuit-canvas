"use client";

import { useEffect, useState } from "react";

type AttendanceRecord = {
  id: number;
  course: string;
  student: string;
  status: string;
  date: string;
};

export default function TeacherAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    async function loadAttendance() {
      const response = await fetch("/api/attendance");
      const data = await response.json();
      setRecords(data);
    }
    loadAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Attendance</h1>
        <p className="mt-2 text-slate-600">Track attendance records for your current classes.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4">{record.student}</td>
                <td className="px-6 py-4">{record.course}</td>
                <td className="px-6 py-4">{record.date}</td>
                <td className="px-6 py-4">{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
