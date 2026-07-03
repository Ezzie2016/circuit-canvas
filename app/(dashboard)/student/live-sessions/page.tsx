"use client";

import { useEffect, useState, useCallback } from "react";
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

const POLL_INTERVAL_MS = 30_000;

function isSessionExpired(session: LiveSession): boolean {
  if (!session.endsAt) return false;
  return new Date(session.endsAt) < new Date();
}

function isSessionActive(session: LiveSession): boolean {
  const now = new Date();
  const start = new Date(session.startsAt);
  const end = session.endsAt ? new Date(session.endsAt) : null;
  // Active = started but not yet ended (or no end time set, and within 4 hours of start)
  if (now < start) return false;
  if (end && now > end) return false;
  if (!end && now.getTime() - start.getTime() > 4 * 60 * 60 * 1000) return false;
  return true;
}

export default function StudentLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/student/live-sessions");
      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load live sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [loadSessions]);

  // Re-check every 30s so expiry status updates without a page reload
  useEffect(() => {
    const interval = setInterval(loadSessions, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const activeSessions = sessions.filter(isSessionActive);
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.startsAt) > new Date()
  );
  const expiredSessions = sessions.filter(isSessionExpired);

  if (loading) return <div className="p-6 text-center text-slate-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Live Sessions</h1>
        <p className="mt-2 text-slate-600">
          Join your course live sessions. You must attend for at least 60 minutes to be marked present.
        </p>
      </div>

      {/* Active Now */}
      {activeSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Now ({activeSessions.length})
          </h2>
          <div className="grid gap-4">
            {activeSessions.map((session) => (
              <SessionCard key={session.id} session={session} state="active" />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Upcoming ({upcomingSessions.length})
          </h2>
          <div className="grid gap-4">
            {upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} state="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* Ended */}
      {expiredSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Past Sessions ({expiredSessions.length})
          </h2>
          <div className="grid gap-4">
            {expiredSessions.map((session) => (
              <SessionCard key={session.id} session={session} state="expired" />
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-slate-600">No live sessions scheduled for your courses.</p>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  state,
}: {
  session: LiveSession;
  state: "active" | "upcoming" | "expired";
}) {
  const expired = state === "expired";
  const active = state === "active";

  return (
    <div
      className={`rounded-3xl border p-6 shadow-sm transition ${
        active
          ? "border-emerald-300 bg-emerald-50"
          : expired
          ? "border-slate-200 bg-white opacity-70"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{session.title}</h3>
            {active && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                LIVE
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{session.course.title}</p>
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
          {session.endsAt && (
            <p className="mt-1 text-sm text-slate-500">
              Ends:{" "}
              {new Date(session.endsAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {expired && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                  Expired
                </span>
              )}
            </p>
          )}
          {session.durationMinutes && (
            <p className="mt-1 text-sm text-slate-500">Duration: {session.durationMinutes} minutes</p>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {expired ? (
            <>
              <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400 text-center cursor-not-allowed">
                Session Ended
              </span>
              <Link
                href={`/student/live-sessions/${session.id}`}
                className="rounded-xl bg-slate-400 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-500 text-center"
              >
                View Attendance
              </Link>
            </>
          ) : active ? (
            <>
              <a
                href={session.link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 text-center"
              >
                Open Link
              </a>
              <Link
                href={`/student/live-sessions/${session.id}`}
                className="rounded-xl bg-[#1d6d58] px-5 py-2 text-sm font-semibold text-white hover:bg-[#124e40] text-center"
              >
                Join + Track
              </Link>
            </>
          ) : (
            <span className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-500 text-center cursor-not-allowed">
              Not started yet
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
