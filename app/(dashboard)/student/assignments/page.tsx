"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type Assignment = {
  id: number;
  title: string;
  course: string;
  courseId: string;
  dueDate: string;
  status: string;
  instructions?: string;
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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Notifications are real-time via SSE.
  // (Assignments will refresh when new assignment records are created for this student,
  //  which the SSE layer should cover once teacher posts.)



  const loadAssignments = useCallback(async () => {
    try {
      const [assignmentsRes] = await Promise.all([
        fetch("/api/assignments"),
      ]);

      const assignmentsData = await assignmentsRes.json();
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setLastUpdated(new Date());

    } catch (error) {
      console.error("Failed to refresh assignments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load — fetch session first to get userId
  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const uid = sessionData?.user?.id || null;
        setUserId(uid);
        await loadAssignments();
      } catch (error) {
        console.error("Failed to load session:", error);
        await loadAssignments();

      }
    }
    init();
  }, [loadAssignments]);



  // SSE: real-time notifications
  useEffect(() => {
    if (!userId) return;

    const es = new EventSource(`/api/notifications/stream`);

    es.addEventListener("notification", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (!payload || !payload.type) return;

        if (payload.type === "init") {
          const list = Array.isArray(payload.notifications) ? payload.notifications : [];
          setNotifications(list);
        }

        if (payload.type === "delta") {
          const list = Array.isArray(payload.notifications) ? payload.notifications : [];
          setNotifications(list);
        }
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      // If the connection drops, the browser will retry.
      // We keep UI as-is.
    };

    return () => {
      es.close();
    };
  }, [userId]);


  const overdueAssignments = assignments.filter(
    (a) => a.status === "Pending" && new Date(a.dueDate) < new Date()
  );
  const upcomingAssignments = assignments.filter(
    (a) => a.status === "Pending" && new Date(a.dueDate) >= new Date()
  );
  const submittedAssignments = assignments.filter((a) => a.status === "Submitted");
  const gradedAssignments = assignments.filter((a) => a.status === "Graded");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#1d6d58] border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Assignments</h1>
          <p className="mt-2 text-slate-600">
            Review upcoming due dates, submission status, and assignment details.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 pt-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live</span>
          {lastUpdated && (
            <span>· Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
        </div>
      </div>

      {/* Real-time live indicator (SSE-backed). */}
      <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live notifications enabled</span>
        {notifications.length > 0 && (
          <span className="text-slate-400">· {notifications.length} update{notifications.length === 1 ? "" : "s"}</span>
        )}
      </div>



      {assignments.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-xl font-semibold text-slate-700">No assignments yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Assignments will appear here when your teacher posts them. This page refreshes automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overdue */}
          {overdueAssignments.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-600">
                Overdue ({overdueAssignments.length})
              </h2>
              <div className="space-y-3">
                {overdueAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} variant="overdue" />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcomingAssignments.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-600">
                Pending ({upcomingAssignments.length})
              </h2>
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} variant="pending" />
                ))}
              </div>
            </section>
          )}

          {/* Submitted */}
          {submittedAssignments.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
                Submitted ({submittedAssignments.length})
              </h2>
              <div className="space-y-3">
                {submittedAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} variant="submitted" />
                ))}
              </div>
            </section>
          )}

          {/* Graded */}
          {gradedAssignments.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
                Graded ({gradedAssignments.length})
              </h2>
              <div className="space-y-3">
                {gradedAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} variant="graded" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  variant,
}: {
  assignment: Assignment;
  variant: "overdue" | "pending" | "submitted" | "graded";
}) {
  const badgeStyles = {
    overdue: "bg-red-100 text-red-700",
    pending: "bg-orange-100 text-orange-700",
    submitted: "bg-emerald-100 text-emerald-700",
    graded: "bg-blue-100 text-blue-700",
  };

  const badgeLabel = {
    overdue: "Overdue",
    pending: "Pending",
    submitted: "Submitted",
    graded: "Graded",
  };

  const daysUntilDue = Math.ceil(
    (new Date(assignment.dueDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      href={`/student/assignments/${assignment.id}`}
      className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#1d6d58] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-slate-500">{assignment.course}</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{assignment.title}</h2>
        </div>
        <span className={`shrink-0 rounded-xl px-3 py-1 text-sm font-semibold ${badgeStyles[variant]}`}>
          {badgeLabel[variant]}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
        <span>
          Due: <span className="font-medium text-slate-700">{assignment.dueDate}</span>
        </span>
        {variant === "pending" && daysUntilDue <= 3 && daysUntilDue > 0 && (
          <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
            Due in {daysUntilDue} day{daysUntilDue === 1 ? "" : "s"}
          </span>
        )}
        {variant === "overdue" && (
          <span className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue
          </span>
        )}
      </div>
    </Link>
  );
}
