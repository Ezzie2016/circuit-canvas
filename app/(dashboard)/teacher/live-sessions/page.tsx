"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type LiveSession = {
  id: string;
  title: string;
  courseId: string;
  course: string;
  start: string;
  end?: string;
  durationMinutes?: number;
  link: string;
  hostLink?: string;
  participantLink?: string;
};

const POLL_INTERVAL_MS = 30_000;

function isExpired(session: LiveSession): boolean {
  if (!session.end) return false;
  return new Date(session.end) < new Date();
}

function isActive(session: LiveSession): boolean {
  const now = new Date();
  const start = new Date(session.start);
  const end = session.end ? new Date(session.end) : null;
  if (now < start) return false;
  if (end && now > end) return false;
  if (!end && now.getTime() - start.getTime() > 4 * 60 * 60 * 1000) return false;
  return true;
}

export default function TeacherLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/live");
      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
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

  useEffect(() => {
    const interval = setInterval(loadSessions, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const activeSessions = sessions.filter(isActive);
  const upcomingSessions = sessions.filter((s) => new Date(s.start) > new Date());
  const expiredSessions = sessions.filter(isExpired);

  if (loading) return <div className="p-6 text-center text-slate-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Live Sessions</h1>
          <p className="mt-2 text-slate-600">
            Manage live classes, join meetings as host, and track student attendance.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 pt-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live</span>
          {lastUpdated && (
            <span>· {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
        </div>
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
          <p className="text-slate-600">No live sessions scheduled yet.</p>
          <Link
            href="/teacher/live/schedule"
            className="mt-4 inline-flex rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#124e40]"
          >
            Schedule a session
          </Link>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">How it works</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>• <strong>Join as Host:</strong> Use the host link to join the meeting as owner/moderator</li>
          <li>• <strong>Link Expiry:</strong> Student join links are automatically disabled once the session end time passes</li>
          <li>• <strong>Manage Attendance:</strong> Click &quot;Manage Attendance&quot; to review and override student records</li>
          <li>• <strong>Auto-enforcement:</strong> Students must attend 60+ minutes to be auto-marked present</li>
          <li>• <strong>Override:</strong> You can manually approve attendance with notes (e.g. &quot;late arrival approved&quot;)</li>
        </ul>
      </div>
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
  const hostUrl = session.hostLink || session.link;

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
            {expired && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                ENDED
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{session.course}</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {new Date(session.start).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {session.end && (
            <p className="mt-1 text-sm text-slate-500">
              Ends:{" "}
              {new Date(session.end).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {session.durationMinutes && (
            <p className="mt-1 text-sm text-slate-500">Duration: {session.durationMinutes} min</p>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {expired ? (
            <>
              <span className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-400 text-center cursor-not-allowed">
                Session Ended
              </span>
              <Link
                href={`/teacher/live-sessions/${session.id}/attendance`}
                className="rounded-xl bg-slate-500 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-600 text-center"
              >
                View Attendance
              </Link>
            </>
          ) : (
            <>
              <a
                href={hostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#1d6d58] px-5 py-2 text-sm font-semibold text-white hover:bg-[#124e40] text-center"
              >
                Join as Host
              </a>
              <Link
                href={`/teacher/live-sessions/${session.id}/attendance`}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 text-center"
              >
                Manage Attendance
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
