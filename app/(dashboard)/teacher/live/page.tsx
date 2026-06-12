"use client";

import { FormEvent, useEffect, useState } from "react";

type LiveSession = {
  id: number;
  title: string;
  course: string;
  start: string;
  duration: number;
  joinUrl: string;
};

type Course = {
  id: string;
  title: string;
};

export default function TeacherLivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [start, setStart] = useState("");
  const [joinUrl, setJoinUrl] = useState("https://meet.example.com/live-session");
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [sessionsRes, coursesRes] = await Promise.all([fetch("/api/live"), fetch("/api/courses")]);
      const sessionsData = await sessionsRes.json();
      const coursesData = await coursesRes.json();
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      if (Array.isArray(coursesData) && coursesData.length > 0) {
        setCourseId(coursesData[0].id);
      }
    }

    loadData();
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

    setSessions((current) => [data, ...current]);
    setMessage(`Scheduled live session: ${data.title}`);
    setTitle("");
    setStart("");
    setDuration(60);
    setJoinUrl("https://meet.example.com/live-session");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Live Sessions</h1>
        <p className="mt-2 text-slate-600">Manage upcoming sessions and schedule new live classes for your courses.</p>
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
          Schedule live class
        </button>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{session.course}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{session.title}</h2>
            <p className="mt-3 text-slate-600">Starts: {new Date(session.start).toLocaleString()}</p>
            <p className="mt-1 text-slate-600">Duration: {session.duration} min</p>
            <a href={session.joinUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-[#1d6d58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124e40]">
              Open session
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
