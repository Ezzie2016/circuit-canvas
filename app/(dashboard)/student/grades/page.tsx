"use client";

import { useEffect, useState } from "react";

interface Submission {
  id: string;
  assignmentTitle: string;
  assignmentDueDate: string | null;
  courseName: string;
  grade: string | null;
  earnedMarks: number | null;
  totalMarks: number | null;
  feedback: string | null;
  status: string;
  createdAt: string;
}

function gradeLabel(pct: number): { letter: string; color: string } {
  if (pct >= 90) return { letter: "A", color: "text-emerald-600" };
  if (pct >= 80) return { letter: "B", color: "text-blue-600" };
  if (pct >= 70) return { letter: "C", color: "text-yellow-600" };
  if (pct >= 60) return { letter: "D", color: "text-orange-600" };
  return { letter: "F", color: "text-red-600" };
}

function ScoreBadge({ earned, total }: { earned: number | null; total: number | null }) {
  if (earned == null || total == null || total === 0) return <span className="text-slate-400 text-sm">Not graded</span>;
  const pct = Math.round((earned / total) * 100);
  const { letter, color } = gradeLabel(pct);
  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-bold ${color}`}>{letter}</span>
      <span className="text-sm text-slate-600">{earned}/{total} ({pct}%)</span>
    </div>
  );
}

export default function StudentGradesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/submissions");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load grades");
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load grades");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const graded = submissions.filter((s) => s.status === "REVIEWED");
  const courses = Array.from(new Set(submissions.map((s) => s.courseName)));
  const filtered = selectedCourse === "all" ? graded : graded.filter((s) => s.courseName === selectedCourse);

  // Overall stats
  const gradedWithMarks = graded.filter((s) => s.earnedMarks != null && s.totalMarks != null && s.totalMarks > 0);
  const overallPct = gradedWithMarks.length > 0
    ? Math.round(gradedWithMarks.reduce((sum, s) => sum + (s.earnedMarks! / s.totalMarks!) * 100, 0) / gradedWithMarks.length)
    : null;

  // Per-course summary
  const courseSummary = courses.map((course) => {
    const courseGraded = graded.filter((s) => s.courseName === course && s.earnedMarks != null && s.totalMarks != null && s.totalMarks! > 0);
    const avg = courseGraded.length > 0
      ? Math.round(courseGraded.reduce((sum, s) => sum + (s.earnedMarks! / s.totalMarks!) * 100, 0) / courseGraded.length)
      : null;
    return { course, avg, count: courseGraded.length, total: submissions.filter((s) => s.courseName === course).length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Grades</h1>
        <p className="mt-1 text-slate-600">Your graded assignments and overall performance.</p>
      </div>

      {loading ? (
        <div className="p-6 text-slate-500">Loading grades…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Overall Average</p>
              {overallPct != null ? (
                <>
                  <p className={`mt-2 text-4xl font-bold ${gradeLabel(overallPct).color}`}>{overallPct}%</p>
                  <p className={`text-lg font-semibold ${gradeLabel(overallPct).color}`}>{gradeLabel(overallPct).letter}</p>
                </>
              ) : (
                <p className="mt-2 text-2xl font-semibold text-slate-400">—</p>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Assignments Submitted</p>
              <p className="mt-2 text-4xl font-bold text-slate-800">{submissions.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Graded</p>
              <p className="mt-2 text-4xl font-bold text-slate-800">{graded.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="mt-2 text-4xl font-bold text-amber-500">{submissions.length - graded.length}</p>
            </div>
          </div>

          {/* Course Summary */}
          {courseSummary.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">By Course</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courseSummary.map(({ course, avg, count, total }) => (
                  <button
                    key={course}
                    onClick={() => setSelectedCourse(selectedCourse === course ? "all" : course)}
                    className={`rounded-2xl border p-4 text-left transition ${selectedCourse === course ? "border-[#1d6d58] bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <p className="font-medium text-slate-800 text-sm">{course}</p>
                    <p className={`mt-1 text-2xl font-bold ${avg != null ? gradeLabel(avg).color : "text-slate-400"}`}>
                      {avg != null ? `${avg}%` : "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{count} graded / {total} submitted</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Breakdown */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Assignment Grades</h2>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-[#1d6d58]"
              >
                <option value="all">All Courses</option>
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                {graded.length === 0 ? "No assignments have been graded yet." : "No graded assignments for this course."}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <div key={s.id} className="p-5 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">{s.assignmentTitle}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{s.courseName}</p>
                        {s.assignmentDueDate && (
                          <p className="text-xs text-slate-400 mt-0.5">Due {s.assignmentDueDate}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <ScoreBadge earned={s.earnedMarks} total={s.totalMarks} />
                      </div>
                    </div>
                    {s.feedback && (
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Feedback: </span>{s.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
