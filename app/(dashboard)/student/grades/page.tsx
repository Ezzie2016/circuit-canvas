"use client";

import { useEffect, useState } from "react";

interface Submission {
  id: string;
  assignmentTitle: string;
  assignmentType: string;
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

interface CategoryBreakdown {
  score: number | null;
  max: number;
  graded: number;
  total: number;
  pending: number;
}

interface CourseGrade {
  courseId: string;
  courseName: string;
  breakdown: Record<string, CategoryBreakdown>;
  attendance: { score: number | null; max: number; rate: number | null; present: number; totalSessions: number };
  total: { earned: number; max: number; isProvisional: boolean };
}

// 80+ A | 60-79 B | 50-59 C | 45-49 D | 40-44 E | below 40 F
function gradeLabel(pct: number) {
  if (pct >= 80) return { letter: "A", color: "text-emerald-700", bg: "bg-emerald-100" };
  if (pct >= 60) return { letter: "B", color: "text-blue-700", bg: "bg-blue-100" };
  if (pct >= 50) return { letter: "C", color: "text-yellow-700", bg: "bg-yellow-100" };
  if (pct >= 45) return { letter: "D", color: "text-orange-700", bg: "bg-orange-100" };
  if (pct >= 40) return { letter: "E", color: "text-rose-700", bg: "bg-rose-100" };
  return { letter: "F", color: "text-red-700", bg: "bg-red-100" };
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  ASSIGNMENT: { label: "Assignment", color: "text-blue-600" },
  QUIZ: { label: "Quiz", color: "text-purple-600" },
  MID_SEMESTER: { label: "Mid-Semester", color: "text-amber-600" },
  EXAM: { label: "Exam", color: "text-rose-600" },
};

function ScoreBadge({ earned, total }: { earned: number | null; total: number | null }) {
  if (earned == null || total == null || total === 0) return null;
  const pct = Math.round((earned / total) * 100);
  const { letter, color, bg } = gradeLabel(pct);
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${bg} ${color}`}>{letter}</span>
      <span className="text-sm font-semibold text-slate-700">
        {earned}/{total} <span className="text-slate-400 font-normal">({pct}%)</span>
      </span>
    </div>
  );
}

export default function StudentGradesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/submissions").then((r) => r.json()),
      fetch("/api/student/grade-summary").then((r) => r.json()),
    ]).then(([subs, summary]) => {
      setSubmissions(Array.isArray(subs) ? subs : []);
      setCourseGrades(summary?.courses ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const graded = submissions.filter((s) => s.status === "REVIEWED");
  const pending = submissions.filter((s) => s.status !== "REVIEWED");
  const courses = Array.from(new Set(submissions.map((s) => s.courseName)));

  const filteredGraded = selectedCourse === "all" ? graded : graded.filter((s) => s.courseName === selectedCourse);
  const filteredPending = selectedCourse === "all" ? pending : pending.filter((s) => s.courseName === selectedCourse);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Grades</h1>
        <p className="mt-1 text-slate-600">Your course grades and assessment breakdown.</p>
      </div>

      {/* Grading key */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { label: "A · 80–100%", pct: 90 },
          { label: "B · 60–79%", pct: 70 },
          { label: "C · 50–59%", pct: 55 },
          { label: "D · 45–49%", pct: 47 },
          { label: "E · 40–44%", pct: 42 },
          { label: "F · Below 40%", pct: 30 },
        ].map(({ label, pct }) => {
          const { color, bg } = gradeLabel(pct);
          return (
            <span key={label} className={`rounded-full px-3 py-1 ${bg} ${color}`}>{label}</span>
          );
        })}
      </div>

      {/* Per-course grade breakdown */}
      {courseGrades.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Course Grade Summary</h2>
          {courseGrades.map((cg) => {
            const totalPct = cg.total.max > 0 ? Math.round((cg.total.earned / cg.total.max) * 100) : null;
            const label = totalPct != null ? gradeLabel(totalPct) : null;
            const categories = ["ASSIGNMENT", "QUIZ", "MID_SEMESTER", "EXAM"];

            return (
              <div key={cg.courseId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{cg.courseName}</h3>
                    {cg.total.isProvisional && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        * Provisional — some assessments are still being graded
                      </p>
                    )}
                  </div>
                  {label && totalPct != null && (
                    <div className="text-right">
                      <p className={`text-4xl font-bold ${label.color}`}>{cg.total.earned}/100</p>
                      <p className={`text-lg font-bold ${label.color}`}>{label.letter}</p>
                    </div>
                  )}
                </div>

                {/* Category rows */}
                <div className="mt-5 space-y-3">
                  {categories.map((type) => {
                    const cat = cg.breakdown[type];
                    const meta = CATEGORY_META[type];
                    if (!cat) return null;

                    return (
                      <div key={type} className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="w-28 sm:w-36 shrink-0">
                          <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                          <p className="text-xs text-slate-400">out of {cat.max}</p>
                        </div>

                        {/* Progress bar */}
                        <div className="flex-1 min-w-[80px] h-2 rounded-full bg-slate-100 overflow-hidden">
                          {cat.score != null && (
                            <div
                              className="h-full rounded-full bg-[#1d6d58]"
                              style={{ width: `${(cat.score / cat.max) * 100}%` }}
                            />
                          )}
                        </div>

                        <div className="w-20 sm:w-28 text-right shrink-0">
                          {cat.score != null ? (
                            <span className="text-sm font-bold text-slate-800">
                              {cat.score}/{cat.max}
                            </span>
                          ) : cat.total === 0 ? (
                            <span className="text-xs text-slate-400">No assessments</span>
                          ) : (
                            <span className="text-xs text-amber-600">Pending</span>
                          )}
                        </div>

                        {cat.total > 0 && (
                          <div className="w-20 sm:w-24 text-right text-xs text-slate-400 shrink-0">
                            {cat.graded}/{cat.total} graded
                            {cat.pending > 0 && (
                              <span className="text-amber-500"> · {cat.pending} pending</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Attendance row */}
                  <div className="flex items-center gap-4">
                    <div className="w-36 shrink-0">
                      <p className="text-sm font-semibold text-emerald-600">Attendance</p>
                      <p className="text-xs text-slate-400">out of 5</p>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      {cg.attendance.score != null && (
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${(cg.attendance.score / 5) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="w-28 text-right shrink-0">
                      {cg.attendance.score != null ? (
                        <span className="text-sm font-bold text-slate-800">
                          {cg.attendance.score}/5
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No sessions yet</span>
                      )}
                    </div>
                    {cg.attendance.totalSessions > 0 && (
                      <div className="w-24 text-right text-xs text-slate-400 shrink-0">
                        {cg.attendance.present}/{cg.attendance.totalSessions} sessions
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mt-2 border-t border-slate-100 pt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Total</p>
                    {cg.total.max > 0 ? (
                      <div className="flex items-center gap-3">
                        {label && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${label.bg} ${label.color}`}>
                            {label.letter}
                          </span>
                        )}
                        <span className="font-bold text-slate-900">
                          {cg.total.earned} / 100
                          {cg.total.isProvisional && (
                            <span className="text-amber-500 text-xs font-normal ml-1">*</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No data yet</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed assignment list */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Assessment Details</h2>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-[#1d6d58]"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => <option key={c} value={c}>{c}</option>)}
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
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_META[s.assignmentType]?.color ?? "text-slate-500"} bg-slate-100`}>
                          {CATEGORY_META[s.assignmentType]?.label ?? s.assignmentType}
                        </span>
                        {isLate(s) && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">LATE</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{s.courseName}</p>
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
            {graded.length === 0 ? "No assessments graded yet." : "Nothing for this course."}
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
                return (
                  <div key={s.id}>
                    <div className="p-5 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-800">{s.assignmentTitle}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_META[s.assignmentType]?.color ?? "text-slate-500"} bg-slate-100`}>
                              {CATEGORY_META[s.assignmentType]?.label ?? s.assignmentType}
                            </span>
                            {isLate(s) && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">LATE</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{s.courseName}</p>
                          {s.assignmentDueDate && (
                            <p className="text-xs text-slate-400 mt-0.5">Due {s.assignmentDueDate}</p>
                          )}
                          <div className="mt-2">
                            <ScoreBadge earned={s.earnedMarks} total={s.totalMarks} />
                          </div>
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
                            {isOpen ? "Hide" : "View submission"}
                          </button>
                        )}
                      </div>

                      {isOpen && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                            Your submission
                          </p>
                          {s.fileUrl && (
                            <a href={s.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d6d58] hover:underline">
                              📎 {s.fileName || "View file"}
                            </a>
                          )}
                          {s.response && (
                            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{s.response}</p>
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
