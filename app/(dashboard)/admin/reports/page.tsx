"use client";

import { useEffect, useState } from "react";

type ReportsData = {
  enrollmentGrowth: {
    value: number;
    currentMonth: number;
    previousMonth: number;
  };
  completionTrends: {
    value: number;
    totalAssignments: number;
    completedCount: number;
  };
  userActivity: {
    strongestBlock: string;
    morningAttendance: number;
    afternoonAttendance: number;
    eveningAttendance: number;
    totalSessionAttendance: number;
  };
  systemOverview: {
    activeUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalAssignments: number;
    totalSubmissions: number;
  };
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch("/api/admin/reports");
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const getEnrollmentSummary = () => {
    if (!reports) return "Loading...";
    const { value, currentMonth, previousMonth } = reports.enrollmentGrowth;
    const trend = value >= 0 ? "increased" : "decreased";
    return `Course enrollments ${trend} ${Math.abs(value)}% month over month (${currentMonth} this month vs ${previousMonth} last month).`;
  };

  const getCompletionSummary = () => {
    if (!reports) return "Loading...";
    const { value, completedCount, totalAssignments } = reports.completionTrends;
    return `Average completion rates are at ${value}% (${completedCount} of ${totalAssignments} assignments completed).`;
  };

  const getActivitySummary = () => {
    if (!reports) return "Loading...";
    const { strongestBlock, afternoonAttendance, morningAttendance, eveningAttendance } = reports.userActivity;
    const blockLabel = strongestBlock.charAt(0).toUpperCase() + strongestBlock.slice(1);
    return `Live session attendance is strongest in the ${blockLabel.toLowerCase()} block (Morning: ${morningAttendance}, Afternoon: ${afternoonAttendance}, Evening: ${eveningAttendance}).`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-2 text-slate-600">Review summaries of performance, engagement, and operational health.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Enrollment Growth */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Enrollment Growth</h2>
          <p className="mt-3 text-slate-600">{getEnrollmentSummary()}</p>
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1d6d58]">
                {reports ? `${reports.enrollmentGrowth.value}%` : "—"}
              </span>
              <span className="text-sm text-slate-500">month over month</span>
            </div>
          </div>
        </div>

        {/* Completion Trends */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Completion Trends</h2>
          <p className="mt-3 text-slate-600">{getCompletionSummary()}</p>
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1d6d58]">
                {reports ? `${reports.completionTrends.value}%` : "—"}
              </span>
              <span className="text-sm text-slate-500">average completion</span>
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">User Activity</h2>
          <p className="mt-3 text-slate-600">{getActivitySummary()}</p>
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1d6d58]">
                {reports ? reports.userActivity.strongestBlock.charAt(0).toUpperCase() + reports.userActivity.strongestBlock.slice(1) : "—"}
              </span>
              <span className="text-sm text-slate-500">block</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      {reports && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">System Overview</h2>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <p className="text-sm text-slate-500">Active Users</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{reports.systemOverview.activeUsers}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Courses</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{reports.systemOverview.totalCourses}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Enrollments</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{reports.systemOverview.totalEnrollments}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Assignments</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{reports.systemOverview.totalAssignments}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Submissions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{reports.systemOverview.totalSubmissions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
