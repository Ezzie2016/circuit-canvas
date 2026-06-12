"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Assignment = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: string;
};

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = Number(params.assignmentId);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    async function loadAssignment() {
      const response = await fetch("/api/assignments");
      const data: Assignment[] = await response.json();
      setAssignment(data.find((item) => item.id === assignmentId) ?? null);
    }
    if (!Number.isNaN(assignmentId)) {
      loadAssignment();
    }
  }, [assignmentId]);

  if (!assignment) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Assignment not found.</p>
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
    fileUrl?: string | null;
    fileName?: string | null;
  };
  const [response, setResponse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState(currentStatus);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  async function getSessionUserId() {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    return data.user?.id;
  }

  useEffect(() => {
    async function load() {
      const userId = await getSessionUserId();
      const res = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
      const data = (await res.json()) as LocalSubmission[] | null;
      const mySubmission = (data || []).find((s) => s.studentId === userId);
      if (mySubmission) {
        setStatus(mySubmission.status);
        setMessage(mySubmission.grade ? `Graded: ${mySubmission.grade}` : "Submitted, awaiting grading");
        setExistingFileUrl(mySubmission.fileUrl || null);
        setExistingFileName(mySubmission.fileName || null);
      }
    }
    load();
  }, [assignmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Response</label>
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} className="w-full mt-1 p-2 border rounded" rows={4} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Attach file (optional)</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div>
          <button type="submit" disabled={submitting} className="rounded-xl bg-[#1d6d58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124e40]">
            {submitting ? "Uploading..." : "Upload submission"}
          </button>
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
