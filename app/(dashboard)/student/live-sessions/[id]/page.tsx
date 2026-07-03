"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SessionDetail = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  durationMinutes?: number;
  link: string;
  course: { id: string; title: string };
};

type TimerState = "not-joined" | "joined" | "left-present" | "left-absent";

export default function StudentLiveSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Check-in code state
  const [codeInput, setCodeInput] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  // Timer-based state (kept as fallback)
  const [timerState, setTimerState] = useState<TimerState>("not-joined");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [joinedAt, setJoinedAt] = useState<Date | null>(null);
  const [finalDurationMinutes, setFinalDurationMinutes] = useState(0);
  const [timerSubmitting, setTimerSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, trackingRes] = await Promise.all([
          fetch(`/api/live-sessions/${sessionId}`),
          fetch(`/api/live-sessions/${sessionId}/attendance-tracking`),
        ]);

        const sessionData = await sessionRes.json();
        setSession(sessionData);

        if (sessionData.endsAt && new Date(sessionData.endsAt) < new Date()) {
          setSessionExpired(true);
        }

        if (trackingRes.ok) {
          const tracking = await trackingRes.json();
          if (tracking.status === "joined") {
            setTimerState("joined");
            if (tracking.record?.attendedAt) {
              const joinTime = new Date(tracking.record.attendedAt);
              setJoinedAt(joinTime);
              const elapsed = Math.floor((Date.now() - joinTime.getTime()) / 1000);
              setElapsedSeconds(Math.max(0, elapsed));
            }
          } else if (tracking.status === "left-present") {
            setTimerState("left-present");
            setFinalDurationMinutes(tracking.record?.durationMinutes || 0);
          } else if (tracking.status === "left-absent") {
            setTimerState("left-absent");
            setFinalDurationMinutes(tracking.record?.durationMinutes || 0);
          }
          // If the attendance record is already PRESENT (via code), reflect that
          if (
            tracking.status === "left-present" ||
            (tracking.record?.status === "PRESENT" && tracking.record?.notes?.includes("check-in code"))
          ) {
            setCheckedIn(true);
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [sessionId]);

  // Timer: count up
  useEffect(() => {
    if (timerState !== "joined") return;
    const interval = setInterval(() => {
      if (joinedAt) {
        const elapsed = Math.floor((Date.now() - joinedAt.getTime()) / 1000);
        setElapsedSeconds(Math.max(0, elapsed));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState, joinedAt]);

  const handleCodeCheckin = async () => {
    if (!codeInput.trim()) return;
    setCodeSubmitting(true);
    setCodeError("");
    try {
      const res = await fetch(`/api/live-sessions/${sessionId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCheckedIn(true);
      } else {
        setCodeError(data.error || "Check-in failed. Please try again.");
      }
    } catch {
      setCodeError("Network error. Please try again.");
    } finally {
      setCodeSubmitting(false);
    }
  };

  const handleJoin = async () => {
    setTimerSubmitting(true);
    try {
      const response = await fetch(`/api/live-sessions/${sessionId}/attendance-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      if (response.ok) {
        const now = new Date();
        setJoinedAt(now);
        setElapsedSeconds(0);
        setTimerState("joined");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to join session");
      }
    } catch {
      alert("Error joining session");
    } finally {
      setTimerSubmitting(false);
    }
  };

  const handleLeave = async () => {
    setTimerSubmitting(true);
    try {
      const response = await fetch(`/api/live-sessions/${sessionId}/attendance-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      if (response.ok) {
        const data = await response.json();
        setFinalDurationMinutes(data.durationMinutes);
        setTimerState(data.status === "PRESENT" ? "left-present" : "left-absent");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to leave session");
      }
    } catch {
      alert("Error leaving session");
    } finally {
      setTimerSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const durationMinutes = Math.floor(elapsedSeconds / 60);
  const MINIMUM_MINUTES = 60;

  if (loading) return <div className="p-6 text-center text-slate-600">Loading session...</div>;
  if (!session) return <div className="p-6 text-center text-red-600">Session not found</div>;

  const sessionActive = !sessionExpired;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">{session.title}</h1>
        <p className="mt-2 text-slate-600">{session.course.title}</p>
      </div>

      {/* Session Info */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Scheduled Time</p>
            <p className="mt-2 text-lg font-medium text-slate-900">
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
          {session.endsAt && (
            <div>
              <p className="text-sm text-slate-500">Session Ends</p>
              <p className="mt-2 text-lg font-medium text-slate-900">
                {new Date(session.endsAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Session Ended */}
      {sessionExpired && !checkedIn && timerState === "not-joined" && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Session Has Ended</h2>
          <p className="mt-2 text-sm text-red-800">
            This live session has ended. Contact your teacher if you need your attendance adjusted.
          </p>
        </div>
      )}

      {/* Check-in Code — primary attendance method */}
      {!checkedIn && sessionActive && timerState !== "left-present" && (
        <div className="rounded-3xl border border-[#1d6d58] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Enter Check-in Code</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your teacher will share a 6-character code during the class. Enter it here to be marked
            Present immediately.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase().slice(0, 6));
                setCodeError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCodeCheckin()}
              placeholder="e.g. XK7P2Q"
              maxLength={6}
              className="w-48 rounded-xl border border-slate-300 px-4 py-3 text-center font-mono text-xl font-bold uppercase tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-[#1d6d58] focus:outline-none"
            />
            <button
              onClick={handleCodeCheckin}
              disabled={codeSubmitting || codeInput.length < 6}
              className="rounded-xl bg-[#1d6d58] px-6 py-3 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50 transition"
            >
              {codeSubmitting ? "Checking in..." : "Submit Code"}
            </button>
          </div>
          {codeError && (
            <p className="mt-3 text-sm font-medium text-red-600">{codeError}</p>
          )}
        </div>
      )}

      {/* Checked in via code */}
      {checkedIn && (
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6">
          <div className="text-center">
            <p className="text-5xl">✓</p>
            <h2 className="mt-2 text-2xl font-bold text-emerald-700">
              Attendance Recorded — PRESENT
            </h2>
            <p className="mt-3 text-sm text-emerald-800">
              You&apos;ve been marked Present for this session via check-in code. Your teacher can
              see this in the attendance panel.
            </p>
          </div>
        </div>
      )}

      {/* Video link */}
      {sessionActive && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Join the Video Call</h2>
          <a
            href={session.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Open Video Link
          </a>
        </div>
      )}

      {/* Timer — fallback attendance method */}
      {sessionActive && !checkedIn && (
        <details className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold text-slate-600 hover:text-slate-900">
            Alternative: Track attendance by time (60-minute timer)
          </summary>
          <div className="px-6 pb-6">
            {timerState === "not-joined" && (
              <div className="pt-2">
                <p className="text-sm text-slate-500 mb-4">
                  If your teacher didn&apos;t share a code, you can use the timer instead. You must stay for at least 60 minutes to be marked Present.
                </p>
                <button
                  onClick={handleJoin}
                  disabled={timerSubmitting}
                  className="rounded-xl bg-slate-700 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {timerSubmitting ? "Starting..." : "Start Timer"}
                </button>
              </div>
            )}

            {timerState === "joined" && (
              <div className="pt-2 text-center">
                <p className="text-sm text-slate-500 mb-2">Time Elapsed</p>
                <p className="text-5xl font-bold text-slate-800 font-mono">{formatTime(elapsedSeconds)}</p>
                <p className="mt-4 text-sm text-slate-500">
                  {durationMinutes < MINIMUM_MINUTES
                    ? `${MINIMUM_MINUTES - durationMinutes} minute${MINIMUM_MINUTES - durationMinutes === 1 ? "" : "s"} remaining`
                    : "✓ You&apos;ve met the 60-minute requirement!"}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <a
                    href={session.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Re-open Video Link
                  </a>
                  <button
                    onClick={handleLeave}
                    disabled={timerSubmitting}
                    className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {timerSubmitting ? "Recording..." : "Leave & Record"}
                  </button>
                </div>
              </div>
            )}

            {timerState === "left-present" && (
              <div className="pt-2 text-center">
                <p className="text-5xl">✓</p>
                <h3 className="mt-2 text-xl font-bold text-emerald-600">Present — {finalDurationMinutes} minutes</h3>
              </div>
            )}

            {timerState === "left-absent" && (
              <div className="pt-2 text-center">
                <p className="text-5xl">✗</p>
                <h3 className="mt-2 text-xl font-bold text-red-600">Absent — only {finalDurationMinutes} minutes</h3>
                <p className="mt-2 text-sm text-red-700">
                  Contact your teacher to manually override if you have a valid excuse.
                </p>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
