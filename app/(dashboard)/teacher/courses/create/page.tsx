"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherCourseCreatePage() {
  const router = useRouter();
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [instructor, setInstructor] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [regRes, sessionRes] = await Promise.all([
          fetch("/api/admin/registration"),
          fetch("/api/auth/session"),
        ]);
        const regJson = await regRes.json();
        const sessionJson = await sessionRes.json();
        setRegistrationOpen(regJson.open ?? true);
        setInstructor(sessionJson.user?.name || "");
      } catch {
        setRegistrationOpen(true);
      }
    })();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (registrationOpen === false) {
      setMessage("Cannot create courses while registration is closed.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, meetingLink, thumbnail }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setMessage(data.error || "Failed to create course.");
      return;
    }
    router.push("/teacher/courses");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Create Course</h1>
        <p className="mt-2 text-slate-600">Launch a new course and publish it to your students.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Course title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to English Language"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </label>
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
            placeholder="https://meet.google.com/..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          Thumbnail URL
          <input
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={registrationOpen === false || submitting}
          className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
            registrationOpen === false
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-[#1d6d58] hover:bg-[#124e40] disabled:opacity-60"
          }`}
        >
          {registrationOpen === false ? "Registration closed" : submitting ? "Creating…" : "Publish course"}
        </button>

        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>
    </div>
  );
}
