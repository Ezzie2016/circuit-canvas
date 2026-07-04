"use client";

import { useEffect, useState, useCallback } from "react";
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
  sessionEndsAt: string | null;
  attendanceList: AttendanceRecord[];
};

type EditData = {
  status: "PRESENT" | "ABSENT";
  notes: string;
  durationMinutes: number | null;
};

const POLL_INTERVAL_MS = 15_000;

export default function AttendanceManagementPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData>({ status: "ABSENT", notes: "", durationMinutes: null });
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    try {
      const response = await fetch(`/api/live-sessions/${sessionId}/attendance`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(`${errorData.error || "Failed to load attendance"}`);
        setSessionData(null);
        return;
      }
      const data = await response.json();
      if (data.attendanceList !== undefined) {
        setSessionData(data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError("Invalid response format from server");
        setSessionData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSessionData(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAttendance();
  }, [loadAttendance]);

  // Real-time polling: reload every 15 seconds to catch students joining/leaving
  useEffect(() => {
    const interval = setInterval(loadAttendance, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadAttendance]);

  const handleEditClick = (record: AttendanceRecord) => {
    setEditingStudent(record.studentId);
    setEditData({
      status: record.status,
      notes: record.notes || "",
      durationMinutes: record.durationMinutes,
    });
  };

  const handleSave = async (studentId: string) => {
    setSaving(true);
    setSaveFeedback(null);
    try {
      const response = await fetch(`/api/live-sessions/${sessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          status: editData.status,
          notes: editData.notes,
          durationMinutes: editData.durationMinutes,
        }),
      });

      if (response.ok) {
        await loadAttendance();
        setEditingStudent(null);
        setSaveFeedback("Attendance updated successfully.");
        setTimeout(() => setSaveFeedback(null), 3000);
      } else {
        const err = await response.json();
        setSaveFeedback(`Error: ${err.error || "Failed to save"}`);
      }
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setSaveFeedback("Error saving attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkMark = async (status: "PRESENT" | "ABSENT") => {
    if (!sessionData) return;
    const updates = sessionData.attendanceList.map((record) =>
      fetch(`/api/live-sessions/${sessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: record.studentId, status }),
      })
    );
    await Promise.all(updates);
    await loadAttendance();
    setSaveFeedback(`All students marked ${status}.`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  if (loading) return <div className="p-6 text-center text-slate-600">Loading...</div>;
  if (error) {
    return (
      <div className="p-6 rounded-3xl border border-red-200 bg-red-50">
        <p className="font-semibold text-red-800">Error Loading Attendance</p>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }
  if (!sessionData) {
    return (
      <div className="p-6 rounded-3xl border border-red-200 bg-red-50">
        <p className="font-semibold text-red-800">Session not found</p>
      </div>
    );
  }

  const presentStudents = sessionData.attendanceList.filter((r) => r.status === "PRESENT");
  const neverAttendedStudents = sessionData.attendanceList.filter(
    (r) => r.status === "ABSENT" && !r.attendedAt
  );
  const leftEarlyStudents = sessionData.attendanceList.filter(
    (r) => r.status === "ABSENT" && r.attendedAt && (r.durationMinutes || 0) < 60
  );

  const sessionEnded = sessionData.sessionEndsAt && new Date(sessionData.sessionEndsAt) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Attendance: {sessionData.sessionTitle}
          </h1>
          <p className="mt-2 text-slate-600">
            {new Date(sessionData.sessionStartsAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {sessionData.sessionEndsAt && (
              <> — {new Date(sessionData.sessionEndsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 pt-2">
          {!sessionEnded && (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live</span>
            </>
          )}
          {lastUpdated && (
            <span>· {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
        </div>
      </div>

      {saveFeedback && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${saveFeedback.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {saveFeedback}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{sessionData.attendanceList.length}</p>
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
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => handleBulkMark("PRESENT")}
          className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Mark All Present
        </button>
        <button
          onClick={() => handleBulkMark("ABSENT")}
          className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Mark All Absent
        </button>
      </div>

      {/* Teacher Override Info */}
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">Teacher Override</p>
        <p className="mt-1 text-sm text-amber-800">
          You can manually change any student&apos;s attendance status and add notes (e.g. &quot;late arrival approved&quot;, &quot;technical issue&quot;).
          Overridden records are marked with a ✓ verified badge. Students can see your notes in their attendance history.
        </p>
      </div>

      <div className="space-y-6">
        {/* Present */}
        {presentStudents.length > 0 && (
          <AttendanceTable
            title="✓ Present"
            color="green"
            records={presentStudents}
            editingStudent={editingStudent}
            editData={editData}
            saving={saving}
            onEditClick={handleEditClick}
            onSave={handleSave}
            onCancel={() => setEditingStudent(null)}
            onEditDataChange={setEditData}
          />
        )}

        {/* Left Early */}
        {leftEarlyStudents.length > 0 && (
          <AttendanceTable
            title="⚠ Left Early"
            color="orange"
            records={leftEarlyStudents}
            editingStudent={editingStudent}
            editData={editData}
            saving={saving}
            onEditClick={handleEditClick}
            onSave={handleSave}
            onCancel={() => setEditingStudent(null)}
            onEditDataChange={setEditData}
            subtitle="Attended but did not meet the 60-minute minimum."
          />
        )}

        {/* Never Attended */}
        {neverAttendedStudents.length > 0 && (
          <AttendanceTable
            title="✗ Never Attended"
            color="red"
            records={neverAttendedStudents}
            editingStudent={editingStudent}
            editData={editData}
            saving={saving}
            onEditClick={handleEditClick}
            onSave={handleSave}
            onCancel={() => setEditingStudent(null)}
            onEditDataChange={setEditData}
          />
        )}

        {sessionData.attendanceList.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-slate-600">No students enrolled in this course yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceTable({
  title,
  color,
  records,
  editingStudent,
  editData,
  saving,
  onEditClick,
  onSave,
  onCancel,
  onEditDataChange,
  subtitle,
}: {
  title: string;
  color: "green" | "orange" | "red";
  records: AttendanceRecord[];
  editingStudent: string | null;
  editData: EditData;
  saving: boolean;
  onEditClick: (record: AttendanceRecord) => void;
  onSave: (studentId: string) => void;
  onCancel: () => void;
  onEditDataChange: (data: EditData) => void;
  subtitle?: string;
}) {
  const colorMap = {
    green: { border: "border-green-200", bg: "bg-green-50", heading: "text-green-900", row: "border-green-100 hover:bg-green-100/50" },
    orange: { border: "border-orange-200", bg: "bg-orange-50", heading: "text-orange-900", row: "border-orange-100 hover:bg-orange-100/50" },
    red: { border: "border-red-200", bg: "bg-red-50", heading: "text-red-900", row: "border-red-100 hover:bg-red-100/50" },
  }[color];

  return (
    <div className={`rounded-3xl border ${colorMap.border} ${colorMap.bg} p-6`}>
      <h2 className={`text-lg font-semibold ${colorMap.heading} mb-1`}>
        {title} ({records.length})
      </h2>
      {subtitle && <p className={`text-sm mb-4 ${colorMap.heading} opacity-75`}>{subtitle}</p>}

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${colorMap.border}`}>
              <th className={`text-left py-3 px-4 font-semibold ${colorMap.heading}`}>Student</th>
              <th className={`text-center py-3 px-4 font-semibold ${colorMap.heading}`}>Duration</th>
              <th className={`text-center py-3 px-4 font-semibold ${colorMap.heading}`}>Status</th>
              <th className={`text-left py-3 px-4 font-semibold ${colorMap.heading}`}>Notes</th>
              <th className={`text-center py-3 px-4 font-semibold ${colorMap.heading}`}>Verified</th>
              <th className={`text-center py-3 px-4 font-semibold ${colorMap.heading}`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.studentId} className={`border-b ${colorMap.row}`}>
                {editingStudent === record.studentId ? (
                  <>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{record.studentName}</p>
                      <p className="text-xs text-slate-500">{record.studentEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        placeholder="min"
                        value={editData.durationMinutes ?? ""}
                        onChange={(e) =>
                          onEditDataChange({
                            ...editData,
                            durationMinutes: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-center text-sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          onEditDataChange({
                            ...editData,
                            status: editData.status === "PRESENT" ? "ABSENT" : "PRESENT",
                          })
                        }
                        className={`rounded-lg px-3 py-1 text-xs font-semibold text-white ${
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
                        placeholder="Add notes (e.g. late arrival approved)..."
                        value={editData.notes}
                        onChange={(e) => onEditDataChange({ ...editData, notes: e.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-500">Will be set ✓</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onSave(record.studentId)}
                          disabled={saving}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={onCancel}
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
                      <p className="font-medium text-slate-900">{record.studentName}</p>
                      <p className="text-xs text-slate-500">{record.studentEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {record.durationMinutes ? `${record.durationMinutes} min` : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          record.status === "PRESENT"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {record.notes || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {record.verifiedByTeacher ? (
                        <span className="text-emerald-600 font-semibold" title="Teacher verified">✓</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Auto</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onEditClick(record)}
                        className="rounded bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Override
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
  );
}
