"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Submission = {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  courseName: string;
  response: string;
  status: string;
  grade?: string | null;
  feedback?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
};

type StudentInfo = { id: string; name: string; email: string };
type AssignmentApi = { id: string; title?: string; courseId?: string };
type CourseApi = { id: string; assignments?: { id: string }[]; courseId?: string; studentList?: StudentInfo[]; teacher?: { id: string; name: string; email: string } };

export default function AssignmentDetailTeacherPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courseStudents, setCourseStudents] = useState<StudentInfo[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState<string>("");

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradeTarget, setGradeTarget] = useState<Submission | null>(null);
  const [earnedMarks, setEarnedMarks] = useState<number>(0);
  const [totalMarks, setTotalMarks] = useState<number>(10);

  const [feedbackValue, setFeedbackValue] = useState("");
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    async function load() {
      const [subsRes, assignmentsRes, coursesRes] = await Promise.all([
        fetch(`/api/submissions?assignmentId=${assignmentId}`),
        fetch(`/api/assignments`),
        fetch(`/api/courses`),
      ]);

      const subs = (await subsRes.json()) as Submission[] | null;
      const assignments = (await assignmentsRes.json()) as (AssignmentApi & { totalMarks?: number })[] | null;
      const courses = (await coursesRes.json()) as CourseApi[] | null;

      setSubmissions(subs || []);

      const assignment = (assignments || []).find((a) => String(a.id) === String(assignmentId));
      setAssignmentTitle(assignment?.title || "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTotalMarks(typeof (assignment as any)?.totalMarks === "number" ? (assignment as any).totalMarks : 10);


      const course = (courses || []).find((c) => {
        if (!c) return false;
        const hasAssignment = Array.isArray(c.assignments) && c.assignments.some((x: { id: string }) => String(x.id) === String(assignmentId));
        return hasAssignment || String(c.id) === String(assignment?.courseId);
      });
      setCourseStudents(course?.studentList || []);
    }
    if (assignmentId && assignmentId !== "NaN") load();
  }, [assignmentId]);

  const submittedStudentIds = new Set(submissions.map((s) => s.studentId));

  async function handleGradeSubmit() {
    if (!gradeTarget) return;
    setGrading(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gradeTarget.id, earnedMarks, feedback: feedbackValue }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to grade");
      setSubmissions((prev) => prev.map((item) => (item.id === gradeTarget.id ? { ...item, grade: json.grade, feedback: json.feedback, status: json.status } : item)));

      // send per-student notification
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Assignment graded", message: `You received ${earnedMarks}/${totalMarks} on ${assignmentTitle}`, recipientId: gradeTarget.studentId }),

      });

      setGradeModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to grade");
    } finally {
      setGrading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">{assignmentTitle || "Assignment"}</h1>
        <p className="mt-2 text-slate-600">Manage submissions for this assignment.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Submitted</h2>
          <ul className="mt-4 space-y-3">
            {submissions.length ? (
              submissions.map((s) => (
                <li key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{s.studentName}</p>
                    <p className="text-xs text-gray-500">{s.assignmentTitle}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm">{s.status}</p>
                    <p className="text-xs text-gray-600">{s.grade ? `Grade: ${s.grade}` : "Not graded"}</p>
                    {s.fileUrl && (
                      <p className="mt-1 text-xs text-blue-700">
                        <a className="underline" href={s.fileUrl} target="_blank" rel="noreferrer">
                          View submission file ({s.fileName || "file"})
                        </a>
                      </p>
                    )}
                    {(!s.fileUrl && s.response) && (
                      <p className="mt-1 text-xs text-slate-600 truncate max-w-[220px]" title={s.response}>
                        Submitted response: {s.response}
                      </p>
                    )}
                    <div>
                      <button

                        onClick={() => {
                          setGradeTarget(s);
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const rawEarned = (s as any).earnedMarks;
                          const initialEarned = typeof rawEarned === "number" && Number.isFinite(rawEarned) ? rawEarned : 0;
                          setEarnedMarks(initialEarned);
                          setFeedbackValue(s.feedback || "");
                          setGradeModalOpen(true);

                        }}
                        className="mt-1 rounded-xl bg-[#1d6d58] px-3 py-1 text-xs font-semibold text-white"
                      >
                        Grade
                      </button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-3 bg-gray-50 rounded text-gray-600">No submissions yet.</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Not Submitted</h2>
          <ul className="mt-4 space-y-3">
            {courseStudents.length ? (
              courseStudents
                .filter((s) => !submittedStudentIds.has(s.id))
                .map((s) => (
                  <li key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                  </li>
                ))
            ) : (
              <li className="p-3 bg-gray-50 rounded text-gray-600">No enrolled students found.</li>
            )}
          </ul>
        </div>
      </div>

      {gradeModalOpen && gradeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setGradeModalOpen(false)} />
          <div className="relative bg-white rounded-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Grade submission — {gradeTarget.studentName}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marks earned (out of {totalMarks})</label>

                <input
                  type="number"
                  min={0}
                  step={1}
                  value={earnedMarks}
                  onChange={(e) => setEarnedMarks(Number(e.target.value))}
                  className="w-full mt-1 p-2 border rounded"
                />
                <p className="mt-1 text-xs text-slate-500">Example: 8/10</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback (optional)</label>
                <textarea value={feedbackValue} onChange={(e) => setFeedbackValue(e.target.value)} className="w-full mt-1 p-2 border rounded" rows={4} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setGradeModalOpen(false)} className="px-3 py-1 rounded">Cancel</button>
                <button
                  onClick={handleGradeSubmit}
                  disabled={grading || !Number.isFinite(earnedMarks)}
                  className="rounded-xl bg-[#1d6d58] px-4 py-2 text-white font-semibold"
                >
                  {grading ? "Saving..." : "Save grade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
