"use client";

import { useEffect, useState } from "react";

interface Submission {
  id: string;
  assignmentTitle: string;
  assignmentDueDate: string | null;
  courseName: string;
  earnedMarks: number | null;
  totalMarks: number | null;
  feedback: string | null;
  response: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: string;
  createdAt: string;
}

// 80+ A | 60-79 B | 50-59 C | 45-49 D | 40-44 E | below 40 F
function gradeLabel(pct: number): { letter: string; textColor: string; bgColor: string } {
  if (pct >= 80) return { letter: "A", textColor: "text-emerald-700", bgColor: "bg-emerald-100" };
  if (pct >= 60) return { letter: "B", textColor: "text-blue-700", bgColor: "bg-blue-100" };
  if (pct >= 50) return { letter: "C", textColor: "text-yellow-700", bgColor: "bg-yellow-100" };
  if (pct >= 45) return { letter: "D", textColor: "text-orange-700", bgColor: "bg-orange-100" };
  if (pct >= 40) return { letter: "E", textColor: "text-rose-700", bgColor: "bg-rose-100" };
  return { letter: "F", textColor: "text-red-700", bgColor: "bg-red-100" };
}

function ScoreBadge({ earned, total }: { earned: number | null; total: number | null }) {
  if (earned == null || total == null || total === 0) return null;
  const pct = Math.round((earned / total) * 100);
  const { letter, textColor, bgColor } = gradeLabel(pct);
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${bgColor} ${textColor}`}>
        {letter}
      </span>
      <span className="text-sm font-semibold text-slate-700">
        {earned}/{total}
        <span className="ml-1 text-slate-400 font-normal">({pct}%)</span>
      </span>
    </div>
  );
}

export default function StudentGradesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) throw new Error(data.error || "Failed to load");
        setSubmissions(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const graded = submissions.filter((s) => s.status === "REVIEWED");
  const pending = submissions.filter((s) => s.status !== "REVIEWED");
  const courses = Array.from(new Set(submissions.map((s) => s.courseName)));

  const filteredGraded =
    selectedCourse === "all" ? graded : graded.filter((s) => s.courseName === selectedCourse);
  const filteredPending =
    selectedCourse === "all" ? pending : pending.filter((s) => s.courseName === selectedCourse);

  // Overall average
  const gradedWithMarks = graded.filter(
    (s) => s.earnedMarks != null && s.totalMarks != null && s.totalMarks > 0
  );
  const overallPct =
    gradedWithMarks.length > 0
      ? Math.round(
          gradedWithMarks.reduce(
            (sum, s) => sum + (s.earnedMarks! / s.totalMarks!) * 100,
            0
          ) / gradedWithMarks.length
        )
      : null;

  // Per-course summary
  const courseSummary = courses.map((course) => {
    const cg = graded.filter(
      (s) => s.courseName === course && s.earnedMarks != null && s.totalMarks! > 0
    );
    const avg =
      cg.length > 0
        ? Math.round(
            cg.reduce((sum, s) => sum + (s.earnedMarks! / s.totalMarks!) * 100, 0) / cg.length
          )
        : null;
    return {
      course,
      avg,
      graded: cg.length,
      total: submissions.filter((s) => s.courseName === course).length,
    };
  });

  function isLate(s: Submission) {
    return s.assignmentDueDate && s.createdAt > s.assignmentDueDate;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#1d6d58] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Grades</h1>
        <p className="mt-1 text-slate-600">Your graded assignments and overall performance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Overall Average</p>
          {overallPct != null ? (
            <>
              <p className={`mt-2 text-4xl font-bold ${gradeLabel(overallPct).textColor}`}>
                {overallPct}%
              </p>
              <p className={`text-lg font-bold ${gradeLabel(overallPct).textColor}`}>
                {gradeLabel(overallPct).letter}
              </p>
            </>
          ) : (
            <p className="mt-2 text-2xl font-semibold text-slate-400">—</p>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-4xl font-bold text-slate-800">{submissions.length}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-700">Graded</p>
          <p className="mt-2 text-4xl font-bold text-emerald-700">{graded.length}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Awaiting Review</p>
          <p className="mt-2 text-4xl font-bold text-amber-600">{pending.length}</p>
        </div>
      </div>

      {/* Grading key */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {(["A · 80–100%", "B · 60–79%", "C · 50–59%", "D · 45–49%", "E · 40–44%", "F · Below 40%"] as const).map(
          (label) => {
            const letter = label[0];
            const pctMap: Record<string, number> = { A: 90, B: 70, C: 55, D: 47, E: 42, F: 30 };
            const { textColor, bgColor } = gradeLabel(pctMap[letter]);
            return (
              <span key={label} className={`rounded-full px-3 py-1 ${bgColor} ${textColor}`}>
                {label}
              </span>
            );
          }
        )}
      </div>

      {/* Course breakdown */}
      {courseSummary.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">By Course</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courseSummary.map(({ course, avg, graded: g, total }) => (
              <button
                key={course}
                onClick={() =>
                  setSelectedCourse(selectedCourse === course ? "all" : course)
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedCourse === course
                    ? "border-[#1d6d58] bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-slate-800 text-sm">{course}</p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    avg != null ? gradeLabel(avg).textColor : "text-slate-400"
                  }`}
                >
                  {avg != null ? `${avg}%` : "—"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {g} graded / {total} submitted
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Course filter + list */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Assignment Grades</h2>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-[#1d6d58]"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Pending rows */}
        {filteredPending.length > 0 && (
          <div>
            <p className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-amber-600 bg-amber-50 border-b border-amber-100">
              Awaiting Review ({filteredPending.length})
            </p>
            <div className="divide-y divide-slate-100">
              {filteredPending.map((s) => (
                <div key={s.id} className="p-5 opacity-75">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800">{s.assignmentTitle}</p>
                        {isLate(s) && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            LATE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{s.courseName}</p>
                      {s.assignmentDueDate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Due {s.assignmentDueDate}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending review
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graded rows */}
        {filteredGraded.length === 0 && filteredPending.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            {graded.length === 0
              ? "No assignments have been graded yet."
              : "No assignments for this course."}
          </div>
        ) : filteredGraded.length > 0 ? (
          <div>
            {filteredPending.length > 0 && (
              <p className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-emerald-700 bg-emerald-50 border-b border-emerald-100">
                Graded ({filteredGraded.length})
              </p>
            )}
            <div className="divide-y divide-slate-100">
              {filteredGraded.map((s) => {
                const isOpen = expandedId === s.id;
                const pct =
                  s.earnedMarks != null && s.totalMarks
                    ? Math.round((s.earnedMarks / s.totalMarks) * 100)
                    : null;

                return (
                  <div key={s.id}>
                    <div className="p-5 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-800">{s.assignmentTitle}</p>
                            {isLate(s) && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                LATE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{s.courseName}</p>
                          {s.assignmentDueDate && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Due {s.assignmentDueDate}
                            </p>
                          )}
                          {pct != null && (
                            <div className="mt-2">
                              <ScoreBadge earned={s.earnedMarks} total={s.totalMarks} />
                            </div>
                          )}
                          {s.feedback && (
                            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
                              <span className="font-medium text-slate-700">Feedback: </span>
                              {s.feedback}
                            </div>
                          )}
                        </div>

                        {(s.response || s.fileUrl) && (
                          <button
                            onClick={() => setExpandedId(isOpen ? null : s.id)}
                            className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400 transition"
                          >
                            {isOpen ? "Hide" : "View my submission"}
                          </button>
                        )}
                      </div>

                      {/* Submission content (expandable) */}
                      {isOpen && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                            Your submission
                          </p>
                          {s.fileUrl && (
                            <a
                              href={s.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d6d58] hover:underline"
                            >
                              📎 {s.fileName || "View submitted file"}
                            </a>
                          )}
                          {s.response && (
                            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                              {s.response}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
