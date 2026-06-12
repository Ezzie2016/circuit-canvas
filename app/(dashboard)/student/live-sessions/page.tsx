"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LiveSession = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  durationMinutes?: number;
  link: string;
  course: {
    id: string;
    title: string;
  };
};

export default function StudentLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await fetch("/api/student/live-sessions");
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error("Failed to load live sessions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const upcomingSessions = sessions.filter(
    (s) => new Date(s.startsAt) > new Date()
  );
  const pastSessions = sessions.filter(
    (s) => new Date(s.startsAt) <= new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Live Sessions</h1>
        <p className="mt-2 text-slate-600">
          Join your course live sessions. You must attend for at least 60 minutes to be marked present.
        </p>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Upcoming Sessions
        </h2>
        {upcomingSessions.length > 0 ? (
          <div className="grid gap-4">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {session.course.title}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {new Date(session.startsAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {session.durationMinutes && (
                      <p className="mt-1 text-sm text-slate-600">
                        Duration: {session.durationMinutes} minutes
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={session.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Open Link
                    </a>
                    <Link
                      href={`/student/live-sessions/${session.id}`}
                      className="rounded-xl bg-[#1d6d58] px-6 py-2 text-sm font-semibold text-white hover:bg-[#124e40]"
                    >
                      Join Session
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-slate-600">No upcoming sessions</p>
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Past Sessions
        </h2>
        {pastSessions.length > 0 ? (
          <div className="grid gap-4">
            {pastSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {session.course.title}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {new Date(session.startsAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/student/live-sessions/${session.id}`}
                    className="rounded-xl bg-slate-400 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-500"
                  >
                    View Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-slate-600">No past sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
