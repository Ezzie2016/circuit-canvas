// app/(dashboard)/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Analytics {
  activeUsers: number;
  totalUsers: number;
  coursesPublished: number;
  totalSubmissions: number;
  newRegistrations: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  severity: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<{id:string;title:string;message:string;createdAt:string}[]>([]);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
      if (data.user.role !== "ADMIN") {
        router.push(`/${data.user.role.toLowerCase()}`);
        return;
      }

      setUser(data.user);

      const [usersRes, analyticsRes, activityRes, regRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/analytics"),
        fetch("/api/activity"),
        fetch("/api/admin/registration"),
      ]);

      const usersData = await usersRes.json();
      const analyticsData = await analyticsRes.json();
      const activityData = await activityRes.json();
      const regData = await regRes.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
      setAnalytics(analyticsData);
      setActivities(Array.isArray(activityData) ? activityData : []);
      setRegistrationOpen(regData.open ?? true);

      const notifRes = await fetch("/api/notifications?role=ADMIN");
      const notifData = await notifRes.json();
      setNotifications(Array.isArray(notifData) ? notifData.slice(0, 10) : []);

      setLoading(false);
    }

    loadSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleToggleRegistration = async () => {
    if (registrationOpen === null) return;
    setToggling(true);
    try {
      const res = await fetch("/api/admin/registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !registrationOpen }),
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrationOpen(data.open);
      }
    } catch (err) {
      console.error("Failed to toggle registration:", err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  const studentCount = users.filter((u) => u.role === "STUDENT").length;
  const teacherCount = users.filter((u) => u.role === "TEACHER").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Good day, {user.name}</h1>
            <p className="mt-1 text-sm text-slate-600">Monitor users, courses, analytics, and system activity from one place.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold">{user.email}</p>
            <p className="mt-1 text-slate-500">Admin account</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* System Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.totalUsers || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Published Courses</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.coursesPublished || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Total Submissions</p>
            <p className="text-3xl font-bold text-[#1d6d58]">{analytics?.totalSubmissions || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">New Registrations Today</p>
            <p className="text-3xl font-bold text-green-600">{analytics?.newRegistrations || 0}</p>
          </div>
        </div>

        {/* Registration Control */}
        <div className="mb-12 bg-white rounded-lg shadow-lg p-6 border-l-4 border-[#1d6d58]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1d6d58]">Course Registration Status</h2>
              <p className="mt-1 text-sm text-slate-600">Control whether students can enroll and teachers can create new courses.</p>
              <p className="mt-3 text-sm">
                {registrationOpen === null ? (
                  "Loading status..."
                ) : registrationOpen ? (
                  <span className="font-semibold text-green-600">Registration is OPEN - Students and teachers can proceed</span>
                ) : (
                  <span className="font-semibold text-red-600">Registration is CLOSED - No new enrollments or courses allowed</span>
                )}
              </p>
            </div>
            <button
              onClick={handleToggleRegistration}
              disabled={toggling || registrationOpen === null}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition ${
                registrationOpen
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-slate-300"
                  : "bg-green-600 hover:bg-green-700 disabled:bg-slate-300"
              }`}
            >
              {toggling ? "Updating..." : registrationOpen ? "Close Registration" : "Open Registration"}
            </button>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#1d6d58] mb-4">User Breakdown</h2>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-semibold">Students</span>
                <span className="text-lg font-bold text-blue-600">{studentCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-semibold">Teachers</span>
                <span className="text-lg font-bold text-purple-600">{teacherCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-semibold">Admins</span>
                <span className="text-lg font-bold text-orange-600">{adminCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-semibold">Active Users</span>
                <span className="text-lg font-bold text-green-600">{analytics?.activeUsers || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#1d6d58] mb-4">System Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/users">
                <button className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded font-semibold text-[#1d6d58]">
                  Manage Users
                </button>
              </Link>
              <Link href="/admin/activity">
                <button className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded font-semibold text-[#1d6d58]">
                  View Activity
                </button>
              </Link>
              <Link href="/admin/analytics">
                <button className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded font-semibold text-[#1d6d58]">
                  System Analytics
                </button>
              </Link>
              <Link href="/admin/settings">
                <button className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded font-semibold text-[#1d6d58]">
                  Settings
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Notifications</h2>
          {notifications.length > 0 ? (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No notifications yet.</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">Recent System Activity</h2>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded">
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                      activity.severity === "success"
                        ? "bg-green-100 text-green-800"
                        : activity.severity === "warning"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {activity.type}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      By {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No recent activity.</p>
          )}
          <Link href="/admin/activity">
            <button className="w-full mt-4 bg-[#1d6d58] text-white py-2 rounded font-semibold hover:bg-[#124e40]">
              View All Activity
            </button>
          </Link>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-[#1d6d58] mb-4">User Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-blue-600 font-semibold text-sm mb-2">STUDENTS</div>
              <div className="text-3xl font-bold text-blue-700">{studentCount}</div>
              <div className="text-xs text-blue-600 mt-1">
                {Math.round(((studentCount / (studentCount + teacherCount + adminCount)) * 100) || 0)}% of users
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-purple-600 font-semibold text-sm mb-2">TEACHERS</div>
              <div className="text-3xl font-bold text-purple-700">{teacherCount}</div>
              <div className="text-xs text-purple-600 mt-1">
                {Math.round(((teacherCount / (studentCount + teacherCount + adminCount)) * 100) || 0)}% of users
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded">
              <div className="text-orange-600 font-semibold text-sm mb-2">ADMINS</div>
              <div className="text-3xl font-bold text-orange-700">{adminCount}</div>
              <div className="text-xs text-orange-600 mt-1">
                {Math.round(((adminCount / (studentCount + teacherCount + adminCount)) * 100) || 0)}% of users
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6">
          <p className="text-sm text-slate-500">© 2026 Circuit Campus. All rights reserved.</p>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </footer>
    </div>
  );
}
