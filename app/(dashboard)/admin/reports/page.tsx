"use client";

import { useEffect, useState } from "react";

type Reports = {
  school: {
    totalUsers: number;
    activeUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalEnrollments: number;
  };
  academic: {
    totalAssignments: number;
    submittedCount: number;
    gradedCount: number;
    pendingCount: number;
    avgGrade: number | null;
  };
  enrollments: {
    thisMonth: number;
    lastMonth: number;
    growthPct: number | null;
  };
  registrations: {
    thisMonth: number;
    lastMonth: number;
    growthPct: number | null;
  };
};

function GrowthBadge({ pct, thisMonth, lastMonth }: { pct: number | null; thisMonth: number; lastMonth: number }) {
  if (thisMonth === 0 && lastMonth === 0) {
    return <span className="text-xs text-slate-400">No activity yet</span>;
  }
  if (pct === null) {
    return (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
        {thisMonth} new this month
      </span>
    );
  }
  const up = pct >= 0;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct)}% vs last month
    </span>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => setReports(d))
      .finally(() => setLoading(false));
  }, []);

  const val = (n: number | null | undefined, suffix = "") =>
    loading || n == null ? "—" : `${n}${suffix}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-2 text-slate-600">School-wide numbers updated in real time.</p>
      </div>

      {/* ── School Overview ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">School Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Total Users",       value: reports?.school.totalUsers },
            { label: "Active Users",      value: reports?.school.activeUsers },
            { label: "Students",          value: reports?.school.totalStudents },
            { label: "Teachers",          value: reports?.school.totalTeachers },
            { label: "Courses",           value: reports?.school.totalCourses },
            { label: "Total Enrollments", value: reports?.school.totalEnrollments },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{val(card.value)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Academic Performance ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Academic Performance</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Assignments</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{val(reports?.academic.totalAssignments)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Submissions Received</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{val(reports?.academic.submittedCount)}</p>
            <p className="mt-1 text-xs text-slate-400">awaiting grading</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Graded</p>
            <p className="mt-3 text-3xl font-semibold text-[#1d6d58]">{val(reports?.academic.gradedCount)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Not Yet Submitted</p>
            <p className="mt-3 text-3xl font-semibold text-amber-600">
              {loading ? "—" : (reports?.academic.pendingCount ?? 0) < 0 ? 0 : val(reports?.academic.pendingCount)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <p className="text-sm text-slate-500">Average Grade (graded submissions)</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {loading ? "—" : reports?.academic.avgGrade != null ? `${reports.academic.avgGrade}%` : "No grades yet"}
            </p>
            {reports?.academic.avgGrade != null && (
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${reports.academic.avgGrade >= 50 ? "bg-[#1d6d58]" : "bg-red-400"}`}
                  style={{ width: `${reports.academic.avgGrade}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Month-on-Month ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">This Month vs Last Month</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Enrollments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-500">New Enrollments</p>
              {!loading && reports && (
                <GrowthBadge
                  pct={reports.enrollments.growthPct}
                  thisMonth={reports.enrollments.thisMonth}
                  lastMonth={reports.enrollments.lastMonth}
                />
              )}
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{val(reports?.enrollments.thisMonth)}</p>
            {!loading && reports && (
              <p className="mt-1 text-xs text-slate-400">{reports.enrollments.lastMonth} last month</p>
            )}
          </div>

          {/* Registrations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-500">New Registrations</p>
              {!loading && reports && (
                <GrowthBadge
                  pct={reports.registrations.growthPct}
                  thisMonth={reports.registrations.thisMonth}
                  lastMonth={reports.registrations.lastMonth}
                />
              )}
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{val(reports?.registrations.thisMonth)}</p>
            {!loading && reports && (
              <p className="mt-1 text-xs text-slate-400">{reports.registrations.lastMonth} last month</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
