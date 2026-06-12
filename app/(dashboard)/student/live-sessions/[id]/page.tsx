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
  course: {
    id: string;
    title: string;
  };
};

type AttendanceStatus = "not-joined" | "joined" | "left-present" | "left-absent";

export default function StudentLiveSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AttendanceStatus>("not-joined");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Load session details
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/live-sessions/${sessionId}`);
        const data = await response.json();
        setSession(data);
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  // Timer for elapsed time
  useEffect(() => {
    if (status !== "joined") return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setDurationMinutes(Math.floor((elapsedSeconds + 1) / 60));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, elapsedSeconds]);

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/live-sessions/${sessionId}/attendance-tracking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join" }),
        }
      );

      if (response.ok) {
        setStatus("joined");
        setElapsedSeconds(0);
        setDurationMinutes(0);
      } else {
        alert("Failed to join session");
      }
    } catch (error) {
      console.error("Failed to join session:", error);
      alert("Error joining session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/live-sessions/${sessionId}/attendance-tracking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leave" }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const attendanceStatus = data.status;
        setStatus(
          attendanceStatus === "PRESENT" ? "left-present" : "left-absent"
        );
        setDurationMinutes(data.durationMinutes);
      } else {
        alert("Failed to leave session");
      }
    } catch (error) {
      console.error("Failed to leave session:", error);
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

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!session)
    return <div className="p-6 text-center">Session not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          {session.title}
        </h1>
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
          <div>
            <p className="text-sm text-slate-500">Minimum Attendance Required</p>
            <p className="mt-2 text-lg font-medium text-slate-900">60 minutes</p>
          </div>
          {session.durationMinutes && (
            <div>
              <p className="text-sm text-slate-500">Session Duration</p>
              <p className="mt-2 text-lg font-medium text-slate-900">
                {session.durationMinutes} minutes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Join/Leave Controls */}
      {status === "not-joined" && (
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">
            Ready to join?
          </h2>
          <p className="mt-2 text-sm text-blue-800">
            Click the button below to record your attendance. You must stay for
            at least 60 minutes to be marked present.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleJoin}
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Joining..." : "Join Session"}
            </button>
            <a
              href={session.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-slate-600 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Open Zoom/Video Link
            </a>
          </div>
        </div>
      )}

      {/* Timer and Leave Button */}
      {status === "joined" && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-900">
            Currently in Session
          </h2>
          <div className="mt-6 text-center">
            <p className="text-sm text-green-800 mb-2">Time Elapsed</p>
            <p className="text-5xl font-bold text-green-600 font-mono">
              {formatTime(elapsedSeconds)}
            </p>
            <p className="mt-4 text-sm text-green-800">
              {durationMinutes < 60
                ? `${60 - durationMinutes} minutes remaining to meet attendance requirement`
                : "✓ You've met the 60-minute requirement! You can leave anytime."}
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={handleLeave}
              disabled={submitting}
              className="w-full rounded-xl bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Leaving..." : "Leave Session"}
            </button>
          </div>
        </div>
      )}

      {/* Result: Present */}
      {status === "left-present" && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <div className="text-center">
            <p className="text-5xl">✓</p>
            <h2 className="mt-2 text-2xl font-bold text-green-600">
              Attendance Recorded
            </h2>
            <p className="mt-2 text-lg font-semibold text-green-900">
              Status: PRESENT
            </p>
            <p className="mt-3 text-sm text-green-800">
              You attended for <strong>{durationMinutes} minutes</strong>. You
              have met the 60-minute requirement.
            </p>
          </div>
        </div>
      )}

      {/* Result: Absent */}
      {status === "left-absent" && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <div className="text-center">
            <p className="text-5xl">✗</p>
            <h2 className="mt-2 text-2xl font-bold text-red-600">
              Attendance Not Recorded
            </h2>
            <p className="mt-2 text-lg font-semibold text-red-900">
              Status: ABSENT
            </p>
            <p className="mt-3 text-sm text-red-800">
              You attended for only <strong>{durationMinutes} minutes</strong>.
              You need to attend for at least <strong>60 minutes</strong> to be
              marked present.
            </p>
            <p className="mt-4 text-xs text-red-700">
              Contact your teacher if you believe this is an error or if you
              have a valid excuse.
            </p>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="font-semibold text-yellow-900">Important Notes</h3>
        <ul className="mt-3 space-y-2 text-sm text-yellow-800">
          <li>
            • Minimum attendance duration: <strong>60 minutes</strong>
          </li>
          <li>
            • If you leave before 60 minutes, you will be marked ABSENT
          </li>
          <li>
            • Your teacher can manually override your attendance status with
            notes
          </li>
          <li>
            • This system tracks attendance for this live session only
          </li>
        </ul>
      </div>
    </div>
  );
}
