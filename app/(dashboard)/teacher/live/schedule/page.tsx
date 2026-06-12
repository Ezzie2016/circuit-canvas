"use client";

import { FormEvent, useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
};

export default function TeacherLiveSchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [start, setStart] = useState("");
  const [joinUrl, setJoinUrl] = useState("https://meet.example.com/live-session");
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      const response = await fetch("/api/courses");
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setCourseId(data[0].id);
      }
    }

    loadCourses();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!title.trim() || !courseId || !start.trim() || !joinUrl.trim()) {
      setError("Please complete all fields before scheduling the live class.");
      return;
    }

    const response = await fetch("/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, courseId, start, duration, link: joinUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to schedule the live class.");
      return;
    }

    setMessage(`Scheduled live session: ${data.title}`);
    setTitle("");
    setStart("");
    setDuration(60);
    setJoinUrl("https://meet.example.com/live-session");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Schedule Class</h1>
        <p className="mt-2 text-slate-600">Create a live session and share the join link with your students.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Session title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Course
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))
              ) : (
                <option value="">No courses available</option>
              )}
            </select>
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-700">
            Start time
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Duration (minutes)
            <input type="number" min={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Join link
            <input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </div>

        <button type="submit" className="rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#124e40]">
          Schedule session
        </button>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </div>
  );
}
