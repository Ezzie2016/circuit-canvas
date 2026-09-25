"use client";

import { useCallback, useEffect, useState } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

type Message = {
  id: string;
  sender: string;
  senderEmail: string;
  courseId: string;
  courseName: string;
  text: string;
  timestamp: string;
};

type Course = {
  id: string;
  title: string;
  enrolled?: boolean;
};

type CurrentUser = {
  id: string;
  email: string;
  role: string;
};

const POLL_INTERVAL_MS = 4000;

export default function MessagePanel({ role }: { role: "STUDENT" | "TEACHER" }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/messages");
      const data = await response.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch {
      // Silent — the next poll will retry.
    }
  }, []);

  useEffect(() => {
    async function init() {
      const [sessionRes, coursesRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/courses"),
      ]);
      const sessionData = await sessionRes.json();
      const coursesData = await coursesRes.json();

      setUser(sessionData.user ?? null);

      const allCourses: Course[] = Array.isArray(coursesData) ? coursesData : [];
      const relevantCourses = role === "STUDENT" ? allCourses.filter((c) => c.enrolled) : allCourses;
      setCourses(relevantCourses);
      setSelectedCourseId((current) => current || relevantCourses[0]?.id || "");

      await loadMessages();
      setLoading(false);
    }
    init();
  }, [role, loadMessages]);

  useEffect(() => {
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages]);

  async function handleSend(text: string) {
    if (!selectedCourseId) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, text }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send message");
        return;
      }
      setMessages((current) => [data, ...current]);
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading messages…</p>
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          {role === "STUDENT"
            ? "Enroll in a course to start messaging your teacher."
            : "Create a course to start messaging your students."}
        </p>
      </div>
    );
  }

  const courseMessages = messages
    .filter((m) => m.courseId === selectedCourseId)
    .slice()
    .reverse();

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Course Messages</h2>
        <label className="block sm:w-64">
          <span className="sr-only">Course</span>
          <select
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
            onChange={(event) => setSelectedCourseId(event.target.value)}
            value={selectedCourseId}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        {courseMessages.length ? (
          courseMessages.map((message) => (
            <MessageBubble
              key={message.id}
              senderName={message.sender}
              text={message.text}
              timestamp={message.timestamp}
              isOwn={message.senderEmail === user?.email}
            />
          ))
        ) : (
          <p className="text-sm text-slate-500">No messages in this course yet. Say hello!</p>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <MessageInput disabled={sending} onSend={handleSend} />
    </div>
  );
}
