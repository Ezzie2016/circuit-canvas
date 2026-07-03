"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Assignment = {
  id: string | number;
  title: string;
  course: string;
  dueDate: string;
  status: string;
};


export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const rawAssignmentId = params.assignmentId;
  const assignmentIdNum = Number(rawAssignmentId);
  const [assignment, setAssignment] = useState<Assignment | null>(null);


  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAssignment() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/assignments`);

        const data: Assignment[] = await response.json();

        // assignment ids are numbers in the DB, but the route param is a string.
        setAssignment(data.find((item) => String(item.id) === String(assignmentIdNum)) ?? null);


      } catch {
        setAssignment(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssignment();
  }, [assignmentIdNum]);

  if (isLoading) {
    return (

      <div className="p-8">
        <p className="text-slate-500">Loading assignment...</p>
      </div>
    );
  }

  if (!assignment) {

    // If assignment details can't be loaded, still allow the student to view/submit using the id from the route.


    // Still render the submission widget so student can submit even if assignment payload is missing.
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Assignment</h1>
          <p className="mt-2 text-slate-600">Due and title could not be loaded.</p>
        </div>

        <StudentSubmissionWidget
          assignmentId={String(assignmentIdNum)}
          currentStatus={"PENDING"}


        />

      </div>

    );
  }



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">{assignment.title}</h1>
        <p className="mt-2 text-slate-600">{assignment.course} • due {assignment.dueDate}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Submission instructions</h2>
        <p className="mt-3 text-slate-600">Prepare your answers, attach any supporting files, and upload them before the deadline.</p>
      </div>

      <StudentSubmissionWidget assignmentId={String(assignment.id)} currentStatus={assignment.status} />




    </div>
  );
}


function StudentSubmissionWidget({ assignmentId, currentStatus }: { assignmentId: string; currentStatus: string }) {

  type LocalSubmission = {
    id: string;
    studentId: string;
    status: string;
    grade?: string | null;
    earnedMarks?: number | null;
    totalMarks?: number | null;
    feedback?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
  };


  const [response, setResponse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>(currentStatus);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);

  const [grade, setGrade] = useState<string | null>(null);
  const [earnedMarks, setEarnedMarks] = useState<number | null>(null);
  const [totalMarks, setTotalMarks] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);


  async function getSessionUserId() {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    return data.user?.id;
  }

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function load() {
      try {
        const userId = await getSessionUserId();
        const res = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
        const data = (await res.json()) as LocalSubmission[] | null;
        const mySubmission = (data || []).find((s) => s.studentId === userId) as LocalSubmission | undefined;

        if (!mySubmission || cancelled) return;

        setStatus(String(mySubmission.status ?? ""));
        setGrade(mySubmission.grade ?? null);
        setFeedback(mySubmission.feedback ?? null);

        setEarnedMarks(typeof mySubmission.earnedMarks === "number" ? mySubmission.earnedMarks : null);
        setTotalMarks(typeof mySubmission.totalMarks === "number" ? mySubmission.totalMarks : null);

        setMessage(
          mySubmission.grade ? `Graded: ${mySubmission.grade}` : "Submitted, awaiting grading"
        );

        setExistingFileUrl(mySubmission.fileUrl || null);
        setExistingFileName(mySubmission.fileName || null);
      } catch {
        // ignore load errors; submission form should still work
      }
    }

    // initial load
    load();

    // real-time-ish refresh: poll every 3s
    intervalId = setInterval(load, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [assignmentId]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "REVIEWED") {
      setMessage("This assignment has already been graded. Submission is closed.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("assignmentId", assignmentId);
      fd.append("response", response || "");
      if (file) fd.append("file", file);

      const res = await fetch("/api/submissions", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStatus("SUBMITTED");
      setMessage("Submission uploaded successfully");
      if (data.fileUrl) {
        setExistingFileUrl(data.fileUrl);
        setExistingFileName(data.fileName || null);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Your status</h2>
      <p className="mt-3 text-slate-700">Current status: <span className="font-semibold">{status}</span></p>

      {(earnedMarks !== null || totalMarks !== null || grade) && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-800">
            Score:{" "}
            {earnedMarks !== null && totalMarks !== null
              ? `${earnedMarks}/${totalMarks}`
              : grade ?? "—"}
          </p>

          {typeof feedback === "string" && feedback.trim() !== "" && (
            <p className="mt-1 text-sm text-emerald-900">Feedback: {feedback}</p>
          )}
        </div>
      )}



      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Response</label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={status === "REVIEWED"}
            className="w-full mt-1 p-2 border rounded disabled:bg-slate-50 disabled:cursor-not-allowed"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Supporting file (optional)</label>

          <input
            id="submission-file"
            type="file"
            className="hidden"
            disabled={status === "REVIEWED"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />


          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => document.getElementById("submission-file")?.click()}
              disabled={status === "REVIEWED"}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose file
            </button>

            <span className="text-sm text-slate-500">
              {file ? file.name : "No file chosen"}
            </span>
          </div>
        </div>


        <div>
          <button
            type="submit"
            disabled={submitting || status === "REVIEWED"}
            className="rounded-xl bg-[#1d6d58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50"
          >
            {status === "REVIEWED"
              ? "Graded"
              : submitting
                ? "Uploading..."
                : "Upload submission"}
          </button>

          {status === "REVIEWED" && (
            <p className="mt-2 text-sm text-slate-500">
              Graded — submission is closed. You can no longer edit or submit.
            </p>
          )}
        </div>
        {message && <p className="text-sm text-gray-700">{message}</p>}
        {existingFileUrl && (
          <p className="mt-2 text-sm">
            Uploaded file: <a className="text-blue-600 underline" href={existingFileUrl} target="_blank" rel="noreferrer">{existingFileName || "View file"}</a>
          </p>
        )}
      </form>
    </div>
  );
}

