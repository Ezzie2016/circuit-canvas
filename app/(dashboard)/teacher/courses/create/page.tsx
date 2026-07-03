"use client";

import { useState, useEffect } from "react";

export default function TeacherCourseCreatePage() {
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/registration");
        const json = await res.json();
        setRegistrationOpen(json.open ?? true);
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

    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await response.json();
    setMessage(`Course created: ${data.title}`);
    setTitle("");
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={registrationOpen === false}
          className={`rounded-xl px-5 py-3 text-sm font-semibold text-white ${registrationOpen === false ? "bg-slate-300 cursor-not-allowed" : "bg-[#1d6d58] hover:bg-[#124e40]"}`}
        >
          {registrationOpen === false ? "Registration closed" : "Publish course"}
        </button>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </form>
    </div>
  );
}
