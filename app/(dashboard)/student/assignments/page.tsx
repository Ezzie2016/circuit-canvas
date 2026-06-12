"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Assignment = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function loadAssignments() {
      const [assignmentsRes, sessionRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/auth/session"),
      ]);

      const [assignmentsData, sessionData] = await Promise.all([
        assignmentsRes.json(),
        sessionRes.json(),
      ]);

      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);

      if (sessionData?.user?.id) {
        const notificationsRes = await fetch(
          `/api/notifications?role=STUDENT&userId=${encodeURIComponent(sessionData.user.id)}`
        );

        let notificationsData: Notification[] = [];
        if (notificationsRes.ok) {
          try {
            const parsed = await notificationsRes.json();
            notificationsData = Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            console.error("Failed to parse notifications JSON:", error);
          }
        } else {
          const errorText = await notificationsRes.text();
          console.error("Notifications request failed:", notificationsRes.status, errorText);
        }

        setNotifications(notificationsData);
      }
    }

    loadAssignments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Assignments</h1>
        <p className="mt-2 text-slate-600">Review upcoming due dates, submission status, and assignment details.</p>
      </div>

      {notifications.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-5 text-slate-900 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">New assignment notifications</p>
              <p className="text-sm text-slate-600">You have {notifications.length} new item{notifications.length === 1 ? "" : "s"}.</p>
            </div>
            <span className="rounded-xl bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              {notifications.length} new
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {notifications.slice(0, 3).map((notification) => (
              <li key={notification.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-semibold">{notification.title}</p>
                <p className="mt-1 text-slate-600">{notification.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700 shadow-sm">
          <p className="text-sm">No new notifications yet. New assignments will appear here when your teacher posts them.</p>
        </div>
      )}

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/student/assignments/${assignment.id}`}
            className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#1d6d58]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{assignment.course}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{assignment.title}</h2>
              </div>
              <span className={`rounded-xl px-3 py-1 text-sm font-semibold ${assignment.status === "Submitted" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                {assignment.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Due date: {assignment.dueDate}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
