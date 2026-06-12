"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  course: string;
  date: string;
  status: string;
}

export default function AttendanceDetailsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const response = await fetch("/api/attendance");
        if (response.ok) {
          const data = await response.json();
          setRecords(data);
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/student" className="text-[#1d6d58] hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1d6d58] mb-8">Attendance Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Total Classes</div>
            <div className="text-3xl font-bold text-[#1d6d58]">{records.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Present</div>
            <div className="text-3xl font-bold text-green-600">{presentCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Absent</div>
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="text-gray-500 text-sm mb-2">Attendance Rate</div>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 rounded-xl h-4 overflow-hidden">
              <div
                className="bg-green-500 h-full"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <div className="ml-4 text-2xl font-bold text-[#1d6d58]">{attendanceRate}%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Course</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{record.course}</td>
                  <td className="px-6 py-4 text-sm">{record.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                        record.status === "PRESENT"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
