"use client";

import { useEffect, useState } from "react";

type LiveSession = {
  id: number;
  title: string;
  course: string;
  start: string;
  duration: number;
  joinUrl: string;
};

export default function StudentLivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);

  useEffect(() => {
    async function loadSessions() {
      const response = await fetch("/api/live");
      const data = await response.json();
      setSessions(data);
    }
    loadSessions();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Live Classes</h1>
        <p className="mt-2 text-slate-600">Join scheduled live sessions and stay on track with your instructors.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{session.course}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{session.title}</h2>
            <p className="mt-3 text-slate-600">Starts: {new Date(session.start).toLocaleString()}</p>
            <p className="mt-1 text-slate-600">Duration: {session.duration} minutes</p>
            <a href={session.joinUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-[#1d6d58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124e40]">
              Join session
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
