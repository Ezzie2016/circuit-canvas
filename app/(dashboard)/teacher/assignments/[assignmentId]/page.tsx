"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type StudentRow = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  submitted: boolean;
  submissionId?: string;
  status: string;
  earnedMarks: number | null;
  feedback: string | null;
  response: string | null;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string | null;
  isLate: boolean;
};

type AssignmentData = {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  totalMarks: number;
  type: string;
  courseName: string;
  courseId: string;
  totalStudents: number;
  submittedCount: number;
  notSubmittedCount: number;
  submissions: StudentRow[];
};

const TYPE_LABELS: Record<string, { label: string; max: number; color: string }> = {
  ASSIGNMENT: { label: "Assignment", max: 10, color: "bg-blue-100 text-blue-700" },
  QUIZ: { label: "Quiz", max: 10, color: "bg-purple-100 text-purple-700" },
  MID_SEMESTER: { label: "Mid-Semester", max: 15, color: "bg-amber-100 text-amber-700" },
  EXAM: { label: "Exam", max: 60, color: "bg-rose-100 text-rose-700" },
};

// 80+ A | 60-79 B | 50-59 C | 45-49 D | 40-44 E | below 40 F
function gradeLabel(pct: number): { letter: string; color: string; bg: string } {
  if (pct >= 80) return { letter: "A", color: "text-emerald-700", bg: "bg-emerald-100" };
  if (pct >= 60) return { letter: "B", color: "text-blue-700", bg: "bg-blue-100" };
  if (pct >= 50) return { letter: "C", color: "text-yellow-700", bg: "bg-yellow-100" };
  if (pct >= 45) return { letter: "D", color: "text-orange-700", bg: "bg-orange-100" };
  if (pct >= 40) return { letter: "E", color: "text-rose-700", bg: "bg-rose-100" };
  return { letter: "F", color: "text-red-700", bg: "bg-red-100" };
}

export default function AssignmentDetailTeacherPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [data, setData] = useState<AssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Online grading state (one card expanded at a time)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [earnedInput, setEarnedInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Direct score entry state (roster mode)
  const [rosterScores, setRosterScores] = useState<Record<string, string>>({});
  const [rosterSaving, setRosterSaving] = useState(false);
  const [rosterMessage, setRosterMessage] = useState("");
  const [showRoster, setShowRoster] = useState(false);

  useEffect(() => {
    if (!assignmentId || assignmentId === "NaN") return;
    fetch(`/api/assignments/${assignmentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        // Pre-fill roster scores from existing grades
        const initial: Record<string, string> = {};
        d.submissions.forEach((s: StudentRow) => {
          if (s.earnedMarks != null) initial[s.studentId] = String(s.earnedMarks);
        });
        setRosterScores(initial);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  function openGrade(row: StudentRow) {
    if (expandedId === row.studentId) { setExpandedId(null); return; }
    setExpandedId(row.studentId);
    setEarnedInput(row.earnedMarks != null ? String(row.earnedMarks) : "");
    setFeedbackInput(row.feedback ?? "");
    setSaveError("");
  }

  async function handleSave(row: StudentRow) {
    if (!row.submissionId) return;
    const earned = Number(earnedInput);
    if (!Number.isFinite(earned) || earned < 0 || earned > (data?.totalMarks ?? 999)) {
      setSaveError(`Marks must be between 0 and ${data?.totalMarks}`);
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.submissionId, earnedMarks: earned, feedback: feedbackInput }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData((prev) => prev ? {
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.studentId === row.studentId
            ? { ...s, earnedMarks: json.earnedMarks, feedback: json.feedback, status: "REVIEWED" }
            : s
        ),
      } : prev);
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Assessment graded",
          message: `You received ${earned}/${data?.totalMarks} on "${data?.title}"`,
          recipientId: row.studentId,
        }),
      });
      setExpandedId(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleRosterSave() {
    if (!data) return;
    setRosterSaving(true);
    setRosterMessage("");
    const scores = data.submissions.map((row) => {
      const raw = rosterScores[row.studentId];
      const val = raw !== undefined && raw !== "" ? Number(raw) : null;
      return { studentId: row.studentId, earnedMarks: val };
    });
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/direct-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setRosterMessage(`Saved ${json.saved} scores.`);
      // Refresh data
      const updated = await fetch(`/api/assignments/${assignmentId}`).then((r) => r.json());
      if (!updated.error) setData(updated);
    } catch (e) {
      setRosterMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setRosterSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#1d6d58] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700">{error || "Assignment not found"}</p>
        <Link href="/teacher/assignments" className="mt-4 inline-block text-sm text-[#1d6d58] hover:underline">
          ← Back to assignments
        </Link>
      </div>
    );
  }

  const typeInfo = TYPE_LABELS[data.type] ?? { label: data.type, max: data.totalMarks, color: "bg-slate-100 text-slate-700" };
  const submitted = data.submissions.filter((s) => s.submitted);
  const notSubmitted = data.submissions.filter((s) => !s.submitted);
  const graded = submitted.filter((s) => s.status === "REVIEWED");
  const dueDate = new Date(data.dueDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/teacher/assignments" className="text-sm font-medium text-[#1d6d58] hover:underline">
          ← Assignments
        </Link>
        <div className="mt-2 flex items-start gap-3 flex-wrap">
          <h1 className="text-3xl font-semibold text-slate-900">{data.title}</h1>
          <span className={`mt-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${typeInfo.color}`}>
            {typeInfo.label} · {typeInfo.max} marks
          </span>
        </div>
        <p className="mt-1 text-slate-500">
          {data.courseName} · Due{" "}
          {dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} ·{" "}
          Graded out of <strong>{data.totalMarks}</strong>
        </p>
      </div>

      {/* Instructions */}
      {data.instructions && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-600 mb-2">Instructions</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.instructions}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          <p className="text-sm text-slate-500">Enrolled</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{data.totalStudents}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm text-center">
          <p className="text-sm text-emerald-700">Submitted</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">{data.submittedCount}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm text-center">
          <p className="text-sm text-orange-700">Graded</p>
          <p className="mt-1 text-3xl font-bold text-orange-700">{graded.length}</p>
        </div>
      </div>

      {/* Direct score entry toggle */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">Direct Score Entry</p>
            <p className="text-sm text-slate-500 mt-0.5">
              For in-person assessments — enter scores from your paper records directly for each student.
              Also works to override any online submission grade.
            </p>
          </div>
          <button
            onClick={() => setShowRoster(!showRoster)}
            className={`shrink-0 rounded-xl px-5 py-2 text-sm font-semibold transition ${
              showRoster
                ? "bg-slate-200 text-slate-700"
                : "bg-[#1d6d58] text-white hover:bg-[#124e40]"
            }`}
          >
            {showRoster ? "Hide roster" : "Open roster"}
          </button>
        </div>

        {showRoster && (
          <div className="mt-5 border-t border-slate-100 pt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 w-48">
                      Score (out of {data.totalMarks})
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Current grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.submissions.map((row) => {
                    const existing = row.earnedMarks;
                    const inputVal = rosterScores[row.studentId] ?? "";
                    const pct = existing != null ? Math.round((existing / data.totalMarks) * 100) : null;
                    const label = pct != null ? gradeLabel(pct) : null;
                    return (
                      <tr key={row.studentId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{row.studentName}</p>
                          <p className="text-xs text-slate-400">{row.studentEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={data.totalMarks}
                            step={0.5}
                            value={inputVal}
                            onChange={(e) =>
                              setRosterScores((prev) => ({ ...prev, [row.studentId]: e.target.value }))
                            }
                            placeholder="—"
                            className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#1d6d58] focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {existing != null && label ? (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${label.bg} ${label.color}`}>
                              {label.letter} · {existing}/{data.totalMarks} ({pct}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Not graded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRosterSave}
                disabled={rosterSaving}
                className="rounded-xl bg-[#1d6d58] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50 transition"
              >
                {rosterSaving ? "Saving…" : "Save all scores"}
              </button>
              {rosterMessage && (
                <p className="text-sm font-medium text-slate-600">{rosterMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Online submissions */}
      {submitted.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Online Submissions ({submitted.length})
          </h2>
          {submitted.map((row) => {
            const isExpanded = expandedId === row.studentId;
            const isGraded = row.status === "REVIEWED" && row.earnedMarks != null;
            const pct = isGraded ? Math.round((row.earnedMarks! / data.totalMarks) * 100) : null;
            const label = pct != null ? gradeLabel(pct) : null;

            return (
              <div
                key={row.studentId}
                className={`rounded-3xl border shadow-sm transition-all ${
                  isExpanded ? "border-[#1d6d58]" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{row.studentName}</p>
                      {row.isLate && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          LATE
                        </span>
                      )}
                      {isGraded && label && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${label.bg} ${label.color}`}>
                          {label.letter} · {row.earnedMarks}/{data.totalMarks} ({pct}%)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{row.studentEmail}</p>
                    {row.submittedAt && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Submitted{" "}
                        {new Date(row.submittedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openGrade(row)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      isExpanded
                        ? "bg-slate-200 text-slate-700"
                        : "bg-[#1d6d58] text-white hover:bg-[#124e40]"
                    }`}
                  >
                    {isExpanded ? "Close" : isGraded ? "Edit grade" : "Review & Grade"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-5 space-y-5 bg-slate-50 rounded-b-3xl">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                        Submission
                      </p>
                      {row.fileUrl && (
                        <a
                          href={row.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1d6d58] hover:border-[#1d6d58] transition"
                        >
                          📎 {row.fileName || "View file"}
                        </a>
                      )}
                      {row.response ? (
                        <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 whitespace-pre-wrap">
                          {row.response}
                        </div>
                      ) : !row.fileUrl ? (
                        <p className="text-sm text-slate-400 italic">No response text.</p>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Marks earned (out of {data.totalMarks})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={data.totalMarks}
                          step={0.5}
                          value={earnedInput}
                          onChange={(e) => { setEarnedInput(e.target.value); setSaveError(""); }}
                          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-lg font-bold text-slate-900 focus:border-[#1d6d58] focus:outline-none"
                          placeholder={`0 – ${data.totalMarks}`}
                        />
                        {earnedInput !== "" && Number.isFinite(Number(earnedInput)) && (
                          <p className={`mt-1 text-sm font-medium ${gradeLabel(Math.round((Number(earnedInput) / data.totalMarks) * 100)).color}`}>
                            {Math.round((Number(earnedInput) / data.totalMarks) * 100)}%{" "}
                            ({gradeLabel(Math.round((Number(earnedInput) / data.totalMarks) * 100)).letter})
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Feedback <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <textarea
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:border-[#1d6d58] focus:outline-none resize-none"
                          placeholder="What did they do well? What needs improvement?"
                        />
                      </div>
                    </div>

                    {saveError && <p className="text-sm font-medium text-red-600">{saveError}</p>}

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setExpandedId(null)}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(row)}
                        disabled={saving || earnedInput === ""}
                        className="rounded-xl bg-[#1d6d58] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50 transition"
                      >
                        {saving ? "Saving…" : "Save Grade"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Not submitted */}
      {notSubmitted.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            No Online Submission ({notSubmitted.length})
          </h2>
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {notSubmitted.map((row) => {
              const scored = row.earnedMarks != null;
              return (
                <div key={row.studentId} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-700">{row.studentName}</p>
                    <p className="text-sm text-slate-400">{row.studentEmail}</p>
                  </div>
                  {scored ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Score entered: {row.earnedMarks}/{data.totalMarks}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Not scored
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">Use "Direct Score Entry" above to record in-person scores for these students.</p>
        </div>
      )}
    </div>
  );
}
