"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type AttendanceRecord = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: "PRESENT" | "ABSENT";
  attendedAt: string | null;
  leftAt: string | null;
  durationMinutes: number | null;
  verifiedByTeacher: boolean;
  notes: string;
  recordId: string | null;
};

type SessionData = {
  liveSessionId: string;
  courseId: string;
  sessionTitle: string;
  sessionStartsAt: string;
  attendanceList: AttendanceRecord[];
};

export default function AttendanceManagementPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AttendanceRecord>>({});
  const [saving, setSaving] = useState(false);

  // Load attendance data on mount
  useEffect(() => {
    async function loadAttendance() {
      try {
        const response = await fetch(`/api/live-sessions/${sessionId}/attendance`);
        if (!response.ok) {
          console.error(`Failed to load attendance: HTTP ${response.status}`);
          const errorData = await response.json();
          console.error("Error details:", errorData);
          setError(`HTTP ${response.status}: ${errorData.error || "Unknown error"}`);
          setSessionData(null);
          return;
        }
        const data = await response.json();
        console.log("Attendance data loaded:", data);
        if (data.error) {
          console.error("API error:", data.error);
          setError(data.error);
          setSessionData(null);
        } else if (data.attendanceList !== undefined) {
          setSessionData(data);
          setError(null);
        } else {
          console.error("Invalid response format:", data);
          setError("Invalid response format from server");
          setSessionData(null);
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          setError(error.message);
        } else {
          setError("Unknown error occurred");
        }
        setSessionData(null);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [sessionId]);

  const handleEditClick = (record: AttendanceRecord) => {
    setEditingStudent(record.studentId);
    setEditData({
      status: record.status,
      attendedAt: record.attendedAt,
      leftAt: record.leftAt,
      notes: record.notes,
    });
  };

  const handleSave = async (studentId: string) => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/live-sessions/${sessionId}/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            ...editData,
          }),
        }
      );

      if (response.ok) {
        // Reload attendance data
        const reloadResponse = await fetch(
          `/api/live-sessions/${sessionId}/attendance`
        );
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          if (data.attendanceList) {
            setSessionData(data);
          }
        }
        setEditingStudent(null);
      }
    } catch (error) {
      console.error("Failed to save attendance:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (currentStatus: string) => {
    setEditData({
      ...editData,
      status: currentStatus === "PRESENT" ? "ABSENT" : "PRESENT",
    });
  };

  const handleMarkAllPresent = async () => {
    if (!sessionData) return;

    const updates = sessionData.attendanceList.map((record) =>
      fetch(`/api/live-sessions/${sessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: record.studentId,
          status: "PRESENT",
        }),
      })
    );

    await Promise.all(updates);
    // Reload
    const response = await fetch(`/api/live-sessions/${sessionId}/attendance`);
    if (response.ok) {
      const data = await response.json();
      if (data.attendanceList) {
        setSessionData(data);
      }
    }
  };

  const handleMarkAllAbsent = async () => {
    if (!sessionData) return;

    const updates = sessionData.attendanceList.map((record) =>
      fetch(`/api/live-sessions/${sessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: record.studentId,
          status: "ABSENT",
        }),
      })
    );

    await Promise.all(updates);
    // Reload
    const response = await fetch(`/api/live-sessions/${sessionId}/attendance`);
    if (response.ok) {
      const data = await response.json();
      if (data.attendanceList) {
        setSessionData(data);
      }
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-200 bg-red-50">
        <p className="text-red-800 font-semibold">Error Loading Attendance</p>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <p className="text-xs text-red-500 mt-4">Check your browser console for more details.</p>
      </div>
    );
  }
  if (!sessionData || sessionData.attendanceList === undefined) {
    return (
      <div className="p-6 rounded-lg border border-red-200 bg-red-50">
        <p className="text-red-800 font-semibold">Session not found</p>
        <p className="text-sm text-red-600 mt-2">
          Unable to load attendance data. Check the session ID or ensure you are the course instructor.
        </p>
      </div>
    );
  }

  // Categorize attendance
  const presentStudents = sessionData.attendanceList.filter(
    (r) => r.status === "PRESENT"
  );
  const neverAttendedStudents = sessionData.attendanceList.filter(
    (r) => r.status === "ABSENT" && !r.attendedAt
  );
  const leftEarlyStudents = sessionData.attendanceList.filter(
    (r) => r.status === "ABSENT" && r.attendedAt && (r.durationMinutes || 0) < 60
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Attendance: {sessionData.sessionTitle}
        </h1>
        <p className="mt-2 text-slate-600">
          Session on{" "}
          {new Date(sessionData.sessionStartsAt).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {sessionData.attendanceList.length}
          </p>
        </div>
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <p className="text-sm text-green-700">Present</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{presentStudents.length}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <p className="text-sm text-orange-700">Left Early</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">{leftEarlyStudents.length}</p>
        </div>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm text-red-700">Never Attended</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{neverAttendedStudents.length}</p>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleMarkAllPresent}
          className="rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Mark All Present
        </button>
        <button
          onClick={handleMarkAllAbsent}
          className="rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Mark All Absent
        </button>
      </div>
      <div className="space-y-6">
        {/* Present Students */}
        {presentStudents.length > 0 && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-4">
              ✓ Present ({presentStudents.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-200">
                    <th className="text-left py-3 px-4 font-semibold text-green-900">
                      Student
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-green-900">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-green-900">
                      Notes
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-green-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {presentStudents.map((record) => (
                    <tr key={record.studentId} className="border-b border-green-100 hover:bg-green-100/50">
                      {editingStudent === record.studentId ? (
                        <>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {record.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.studentEmail}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="minutes"
                              value={editData.durationMinutes || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  durationMinutes: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                })
                              }
                              className="w-20 rounded border border-slate-300 px-2 py-1 text-center text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={editData.notes || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  notes: e.target.value,
                                })
                              }
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleSave(record.studentId)}
                                disabled={saving}
                                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingStudent(null)}
                                className="rounded bg-slate-300 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {record.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.studentEmail}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-700">
                            {record.durationMinutes
                              ? `${record.durationMinutes} min`
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-sm">
                            {record.notes || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleEditClick(record)}
                              className="rounded bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Left Early */}
        {leftEarlyStudents.length > 0 && (
          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
            <h2 className="text-lg font-semibold text-orange-900 mb-4">
              ⚠ Left Early ({leftEarlyStudents.length})
            </h2>
            <p className="text-sm text-orange-800 mb-4">
              Attended but did not meet the 60-minute minimum requirement.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-200">
                    <th className="text-left py-3 px-4 font-semibold text-orange-900">
                      Student
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-orange-900">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-orange-900">
                      Notes
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-orange-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leftEarlyStudents.map((record) => (
                    <tr key={record.studentId} className="border-b border-orange-100 hover:bg-orange-100/50">
                      {editingStudent === record.studentId ? (
                        <>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {record.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.studentEmail}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="minutes"
                              value={editData.durationMinutes || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  durationMinutes: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                })
                              }
                              className="w-20 rounded border border-slate-300 px-2 py-1 text-center text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={editData.notes || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  notes: e.target.value,
                                })
                              }
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleSave(record.studentId)}
                                disabled={saving}
                                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingStudent(null)}
                                className="rounded bg-slate-300 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {record.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.studentEmail}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-orange-700 font-semibold">
                            {record.durationMinutes
                              ? `${record.durationMinutes} min`
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-sm">
                            {record.notes || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleEditClick(record)}
                              className="rounded bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Never Attended */}
        {neverAttendedStudents.length > 0 && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">
              ✗ Never Attended ({neverAttendedStudents.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-red-200">
                    <th className="text-left py-3 px-4 font-semibold text-red-900">
                      Student
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-red-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-red-900">
                      Notes
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-red-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {neverAttendedStudents.map((record) => (
                    <tr key={record.studentId} className="border-b border-red-100 hover:bg-red-100/50">
                      {editingStudent === record.studentId ? (
                        <>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {record.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.studentEmail}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() =>
                                handleToggleStatus(editData.status || "ABSENT")
                              }
                              className={`rounded-lg px-3 py-1 font-semibold text-white ${
                                editData.status === "PRESENT"
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              {editData.status}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={editData.notes || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  notes: e.target.value,
                                })
                              }
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleSave(record.studentId)}
                                disabled={saving}
                                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingStudent(null)}
                                className="rounded bg-slate-300 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {record.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.studentEmail}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="rounded-lg px-3 py-1 font-semibold text-white bg-red-600">
                              ABSENT
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-sm">
                            {record.notes || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleEditClick(record)}
                              className="rounded bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Information Notice */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <p className="text-sm text-blue-900">
          <strong>Attendance Categories:</strong> 
        </p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
          <li><strong>✓ Present:</strong> Attended for 60+ minutes</li>
          <li><strong>⚠ Left Early:</strong> Attended but less than 60 minutes</li>
          <li><strong>✗ Never Attended:</strong> Did not join the session</li>
        </ul>
      </div>
    </div>
  );
}
