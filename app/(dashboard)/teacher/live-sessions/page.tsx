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
        <h3 className="font-semibold text-blue-900">How attendance works</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>• <strong>Check-in Code:</strong> Generate a code during class — students enter it in the app to be marked Present instantly</li>
          <li>• <strong>Verbal:</strong> Say the code on the Google Meet/Zoom call, type it in the chat, or share your screen</li>
          <li>• <strong>15-minute window:</strong> Each code is valid for 15 minutes — regenerate if needed</li>
          <li>• <strong>Join as Host:</strong> Use the host link to join the meeting as owner/moderator</li>
          <li>• <strong>Override:</strong> You can manually approve attendance from the Manage Attendance panel</li>
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

  // Check-in code state (active sessions only)
  const [codeInfo, setCodeInfo] = useState<{ code: string; expiresAt: string } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [codeLoading, setCodeLoading] = useState(false);

  // Load existing code on mount for active sessions
  useEffect(() => {
    if (!active) return;
    fetch(`/api/live-sessions/${session.id}/checkin-code`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.code) {
          setCodeInfo(data);
          const left = Math.max(
            0,
            Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
          );
          setSecondsLeft(left);
        }
      })
      .catch(() => null);
  }, [session.id, active]);

  // Countdown timer
  useEffect(() => {
    if (!codeInfo) return;
    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.floor((new Date(codeInfo.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(left);
      if (left === 0) setCodeInfo(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [codeInfo]);

  const handleGenerateCode = async () => {
    setCodeLoading(true);
    try {
      const res = await fetch(`/api/live-sessions/${session.id}/checkin-code`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setCodeInfo(data);
        setSecondsLeft(15 * 60);
      }
    } catch {
      // ignore
    } finally {
      setCodeLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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

      {/* Check-in Code Panel — active sessions only */}
      {active && (
        <div className="mt-5 border-t border-emerald-200 pt-5">
          {codeInfo ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-1">
                  Check-in Code
                </p>
                <p className="font-mono text-4xl font-bold tracking-[0.25em] text-slate-900">
                  {codeInfo.code}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Expires in{" "}
                  <span
                    className={`font-semibold ${
                      secondsLeft < 60 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {formatCountdown(secondsLeft)}
                  </span>
                </p>
              </div>
              <button
                onClick={handleGenerateCode}
                disabled={codeLoading}
                className="rounded-xl border-2 border-emerald-600 px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
              >
                {codeLoading ? "Generating..." : "New Code"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Check-in Code</p>
                <p className="text-sm text-slate-500">
                  Generate a 6-character code — students enter it during class to be marked Present.
                </p>
              </div>
              <button
                onClick={handleGenerateCode}
                disabled={codeLoading}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shrink-0"
              >
                {codeLoading ? "Generating..." : "Generate Code"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
