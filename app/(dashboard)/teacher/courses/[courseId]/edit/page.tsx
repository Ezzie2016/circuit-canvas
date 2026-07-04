"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Course = {
  id: string;
  title: string;
  code?: string | null;
  description?: string;
  instructor: string;
  students: number;
  meetingLink?: string;
  thumbnail?: string;
  status: string;
};

export default function TeacherCourseEditPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [instructor, setInstructor] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        setCourse(null);
        setLoading(false);
        return;
      }
      const found: Course = await response.json();
      setCourse(found);
      setTitle(found.title);
      setCode(found.code ?? "");
      setDescription(found.description ?? "");
      setMeetingLink(found.meetingLink ?? "");
      setThumbnail(found.thumbnail ?? "");
      setInstructor(found.instructor);
      setLoading(false);
    }
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Loading course details…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Course not found.</p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const response = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        code,
        description,
        meetingLink,
        thumbnail,
      }),
    });

    if (!response.ok) {
      setMessage("Could not update course. Please try again.");
      return;
    }

    const updated: Course = await response.json();
    setCourse(updated);
    setTitle(updated.title);
    setCode(updated.code ?? "");
    setDescription(updated.description ?? "");
    setMeetingLink(updated.meetingLink ?? "");
    setThumbnail(updated.thumbnail ?? "");
    setMessage(`Course updated: ${updated.title}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Edit Course</h1>
        <p className="mt-2 text-slate-600">Update the course title and details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Course title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Course code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ENG101"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Instructor
            <input
              value={instructor}
              disabled
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm text-slate-700">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            rows={4}
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          Meeting link
          <input
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          Thumbnail URL
          <input
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" className="rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#124e40]">
            Save changes
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (!window.confirm("Delete this course and all associated content?")) {
                return;
              }

              setDeleting(true);
              const response = await fetch(`/api/courses/${courseId}`, {
                method: "DELETE",
              });
              setDeleting(false);

              if (!response.ok) {
                setMessage("Could not delete course. Please try again.");
                return;
              }

              router.push("/teacher/courses");
            }}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete course"}
          </button>
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </form>
    </div>
  );
}
