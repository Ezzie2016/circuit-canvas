"use client";

import { useEffect, useState } from "react";
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

export default function TeacherLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await fetch("/api/live");
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
    (s) => new Date(s.start) > new Date()
  );
  const pastSessions = sessions.filter((s) => new Date(s.start) <= new Date());

  if (loading)
    return <div className="p-6 text-center text-slate-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Live Sessions</h1>
        <p className="mt-2 text-slate-600">
          Manage your live class sessions, join meetings as host, and track student attendance.
        </p>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Upcoming Sessions ({upcomingSessions.length})
        </h2>
        {upcomingSessions.length > 0 ? (
          <div className="grid gap-4">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {session.course}
                    </p>
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
                    {session.durationMinutes && (
                      <p className="mt-1 text-sm text-slate-600">
                        Duration: {session.durationMinutes} minutes
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={session.hostLink || session.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-[#1d6d58] px-6 py-2 text-sm font-semibold text-white hover:bg-[#124e40] text-center"
                    >
                      Join as Host
                    </a>
                    <Link
                      href={`/teacher/live-sessions/${session.id}/attendance`}
                      className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 text-center"
                    >
                      Manage Attendance
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-slate-600">No upcoming sessions scheduled</p>
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Past Sessions ({pastSessions.length})
          </h2>
          <div className="grid gap-4">
            {pastSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {session.course}
                    </p>
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
                  </div>
                  <Link
                    href={`/teacher/live-sessions/${session.id}/attendance`}
                    className="rounded-xl bg-slate-500 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                  >
                    View Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">How it works</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>
            • <strong>Join as Host:</strong> Use the host link to join the meeting as owner/moderator
          </li>
          <li>
            • <strong>Manage Attendance:</strong> After class, click "Manage Attendance" to mark students present/absent
          </li>
          <li>
            • <strong>Auto-enforcement:</strong> Students must attend 60+ minutes to be marked present
          </li>
          <li>
            • <strong>Override:</strong> You can manually approve attendance with notes (e.g., "late arrival approved")
          </li>
        </ul>
      </div>
    </div>
  );
}
