"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const navLinks: Record<string, { href: string; label: string }[]> = {
  STUDENT: [
    { href: "/student", label: "Overview" },
    { href: "/student/courses", label: "Courses" },
    { href: "/student/assignments", label: "Assignments" },
    { href: "/student/live", label: "Live Classes" },
    { href: "/student/grades", label: "Grades" },
    { href: "/student/progress", label: "Progress" },
  ],
  TEACHER: [
    { href: "/teacher", label: "Overview" },
    { href: "/teacher/courses", label: "Courses" },
    { href: "/teacher/assignments", label: "Assignments" },
    { href: "/teacher/live", label: "Live Classes" },
    { href: "/teacher/attendance", label: "Attendance" },
    { href: "/teacher/students", label: "Students" },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/courses", label: "Courses" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/reports", label: "Reports" },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchSession() {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      setChecking(false);
    }

    fetchSession();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-500">Verifying your session…</p>
        </div>
      </div>
    );
  }

  const role = user?.role || "STUDENT";
  const links = navLinks[role] || navLinks.STUDENT;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Circuit Campus</p>
            <h1 className="text-2xl font-semibold">
              {role === "STUDENT" ? "Student" : role === "TEACHER" ? "Teacher" : "Admin"} Portal
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-3xl bg-[#1d6d58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#124e40]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-600">Navigation</p>
            <div className="mt-4 space-y-2">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-[#1d6d58] text-white" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Portal highlights</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Session-based auth with secure cookies</li>
              <li>• Role-aware navigation</li>
              <li>• Course, assignment, and live schedule views</li>
              <li>• Notifications and attendance tracking</li>
            </ul>
          </div>
        </aside>

        <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{children}</main>
      </div>
    </div>
  );
}
