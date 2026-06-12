"use client";

import { useEffect, useState } from "react";

type AttendanceRecord = {
  id: string;
  courseName: string;
  sessionTitle: string;
  status: "PRESENT" | "ABSENT";
  date: string;
  attendedAt?: string;
  leftAt?: string;
  durationMinutes?: number;
  verifiedByTeacher: boolean;
  notes?: string;
};

export default function StudentAttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  useEffect(() => {
    async function loadRecords() {
      try {
        const response = await fetch("/api/student/attendance-records");
        const data = await response.json();
        setRecords(data);
      } catch (error) {
        console.error("Failed to load attendance records:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (filter === "all") return true;
    if (filter === "present") return r.status === "PRESENT";
    if (filter === "absent") return r.status === "ABSENT";
    return true;
  });

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const attendanceRate =
    records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  if (loading)
    return <div className="p-6 text-center text-slate-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Attendance History
        </h1>
        <p className="mt-2 text-slate-600">
          View your live session attendance records. Minimum 60 minutes required to be marked present.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Sessions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{records.length}</p>
        </div>
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <p className="text-sm text-green-700">Present</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{presentCount}</p>
        </div>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm text-red-700">Absent</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <p className="text-sm text-blue-700">Attendance Rate</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{attendanceRate}%</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            filter === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-slate-900 hover:bg-slate-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("present")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            filter === "present"
              ? "bg-green-600 text-white"
              : "bg-slate-200 text-slate-900 hover:bg-slate-300"
          }`}
        >
          Present
        </button>
        <button
          onClick={() => setFilter("absent")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            filter === "absent"
              ? "bg-red-600 text-white"
              : "bg-slate-200 text-slate-900 hover:bg-slate-300"
          }`}
        >
          Absent
        </button>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Session Records
        </h2>
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Course
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Session
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">
                    Date
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">
                    Duration
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-900 font-medium">
                      {record.courseName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {record.sessionTitle}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {record.durationMinutes
                        ? `${record.durationMinutes} min`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          record.status === "PRESENT"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {record.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600">
            {records.length === 0
              ? "No attendance records yet"
              : `No ${filter} sessions to display`}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">Attendance Information</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>
            • <strong>Minimum Duration:</strong> You must attend for 60+ minutes to be marked present
          </li>
          <li>
            • <strong>Auto-recorded:</strong> Attendance is automatically recorded when you join and leave a session
          </li>
          <li>
            • <strong>Teacher Override:</strong> Your teacher can manually adjust attendance with notes
          </li>
          <li>
            • <strong>Verified:</strong> Checkmark (✓) indicates teacher has verified the attendance record
          </li>
        </ul>
      </div>
    </div>
  );
}
