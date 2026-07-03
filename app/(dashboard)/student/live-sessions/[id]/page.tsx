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

type AttendanceState = "not-joined" | "joined" | "left-present" | "left-absent";

export default function StudentLiveSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AttendanceState>("not-joined");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [joinedAt, setJoinedAt] = useState<Date | null>(null);
  const [finalDurationMinutes, setFinalDurationMinutes] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Load session details + restore attendance state
  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, trackingRes] = await Promise.all([
          fetch(`/api/live-sessions/${sessionId}`),
          fetch(`/api/live-sessions/${sessionId}/attendance-tracking`),
        ]);

        const sessionData = await sessionRes.json();
        setSession(sessionData);

        // Check if session has expired
        if (sessionData.endsAt && new Date(sessionData.endsAt) < new Date()) {
          setSessionExpired(true);
        }

        // Restore attendance state if student already joined
        if (trackingRes.ok) {
          const tracking = await trackingRes.json();
          if (tracking.status === "joined") {
            setStatus("joined");
            // Restore elapsed time from server-side attendedAt
            if (tracking.record?.attendedAt) {
              const joinTime = new Date(tracking.record.attendedAt);
              setJoinedAt(joinTime);
              const elapsed = Math.floor((Date.now() - joinTime.getTime()) / 1000);
              setElapsedSeconds(Math.max(0, elapsed));
            }
          } else if (tracking.status === "left-present") {
            setStatus("left-present");
            setFinalDurationMinutes(tracking.record?.durationMinutes || 0);
          } else if (tracking.status === "left-absent") {
            setStatus("left-absent");
            setFinalDurationMinutes(tracking.record?.durationMinutes || 0);
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

  // Timer: count up from joinedAt
  useEffect(() => {
    if (status !== "joined") return;
    const interval = setInterval(() => {
      if (joinedAt) {
        const elapsed = Math.floor((Date.now() - joinedAt.getTime()) / 1000);
        setElapsedSeconds(Math.max(0, elapsed));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status, joinedAt]);

  const handleJoin = async () => {
    setSubmitting(true);
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
        setStatus("joined");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to join session");
      }
    } catch (error) {
      console.error("Failed to join:", error);
      alert("Error joining session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/live-sessions/${sessionId}/attendance-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });

      if (response.ok) {
        const data = await response.json();
        setFinalDurationMinutes(data.durationMinutes);
        setStatus(data.status === "PRESENT" ? "left-present" : "left-absent");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to leave session");
      }
    } catch (error) {
      console.error("Failed to leave:", error);
      alert("Error leaving session");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">{session.title}</h1>
        <p className="mt-2 text-slate-600">{session.course.title}</p>
      </div>

      {/* Session Info */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
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
                {new Date(session.endsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-slate-500">Minimum Attendance Required</p>
            <p className="mt-2 text-lg font-medium text-slate-900">60 minutes</p>
          </div>
        </div>
      </div>

      {/* Expired */}
      {sessionExpired && status === "not-joined" && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Session Has Ended</h2>
          <p className="mt-2 text-sm text-red-800">
            This live session has ended. You can no longer join or record attendance.
            Contact your teacher if you believe this is an error.
          </p>
        </div>
      )}

      {/* Join */}
      {status === "not-joined" && !sessionExpired && (
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">Ready to join?</h2>
          <p className="mt-2 text-sm text-blue-800">
            Click &quot;Join + Track Attendance&quot; to start the attendance timer. You must stay for at
            least 60 minutes to be marked present.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleJoin}
              disabled={submitting}
              className="rounded-xl bg-[#1d6d58] px-8 py-3 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50"
            >
              {submitting ? "Joining..." : "Join + Track Attendance"}
            </button>
            <a
              href={session.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open Video Link
            </a>
          </div>
        </div>
      )}

      {/* Timer */}
      {status === "joined" && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-900">Currently in Session</h2>
          <div className="mt-6 text-center">
            <p className="text-sm text-green-800 mb-2">Time Elapsed</p>
            <p className="text-5xl font-bold text-green-600 font-mono">{formatTime(elapsedSeconds)}</p>
            <p className="mt-4 text-sm text-green-800">
              {durationMinutes < MINIMUM_MINUTES
                ? `${MINIMUM_MINUTES - durationMinutes} minute${MINIMUM_MINUTES - durationMinutes === 1 ? "" : "s"} remaining to meet attendance requirement`
                : "✓ You've met the 60-minute requirement! You can leave anytime."}
            </p>
          </div>
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
              disabled={submitting}
              className="rounded-xl bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Leave & Record Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* Present */}
      {status === "left-present" && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <div className="text-center">
            <p className="text-5xl">✓</p>
            <h2 className="mt-2 text-2xl font-bold text-green-600">Attendance Recorded — PRESENT</h2>
            <p className="mt-3 text-sm text-green-800">
              You attended for <strong>{finalDurationMinutes} minutes</strong> and met the 60-minute requirement.
              Your teacher can see this in their attendance panel.
            </p>
          </div>
        </div>
      )}

      {/* Absent */}
      {status === "left-absent" && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <div className="text-center">
            <p className="text-5xl">✗</p>
            <h2 className="mt-2 text-2xl font-bold text-red-600">Attendance Recorded — ABSENT</h2>
            <p className="mt-3 text-sm text-red-800">
              You attended for only <strong>{finalDurationMinutes} minutes</strong>. You needed at least{" "}
              <strong>60 minutes</strong> to be marked present.
            </p>
            <p className="mt-4 text-xs text-red-700">
              Contact your teacher if you have a valid excuse — they can manually override your attendance.
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="font-semibold text-yellow-900">Important Notes</h3>
        <ul className="mt-3 space-y-2 text-sm text-yellow-800">
          <li>• Minimum attendance: <strong>60 minutes</strong></li>
          <li>• Leaving early will mark you <strong>ABSENT</strong></li>
          <li>• Your teacher can manually override your attendance status with notes</li>
          <li>• Attendance is recorded in real time — your teacher can see it immediately</li>
          {session.endsAt && <li>• This session&apos;s join link expires at <strong>{new Date(session.endsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</strong></li>}
        </ul>
      </div>
    </div>
  );
}
