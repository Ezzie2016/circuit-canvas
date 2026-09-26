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
    { href: "/student/attendance-history", label: "Attendance" },
    { href: "/student/progress", label: "Progress" },
    { href: "/student/messages", label: "Messages" },
    { href: "/profile", label: "My Profile" },
  ],
  TEACHER: [
    { href: "/teacher", label: "Overview" },
    { href: "/teacher/courses", label: "Courses" },
    { href: "/teacher/assignments", label: "Assignments" },
    { href: "/teacher/live", label: "Live Classes" },
    { href: "/teacher/attendance", label: "Attendance" },
    { href: "/teacher/students", label: "Students" },
    { href: "/teacher/messages", label: "Messages" },
    { href: "/profile", label: "My Profile" },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/courses", label: "Courses" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/profile", label: "My Profile" },
  ],
};

const roleLabel: Record<string, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  ADMIN: "Admin",
};

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="font-display flex h-8 w-8 items-center justify-center rounded-md border border-[#17233d]/15 bg-[#17233d] text-sm font-semibold text-[#d9b877]">
        C
      </span>
      <span className="font-display hidden text-[15px] font-medium text-[#17233d] sm:block">
        Circuit Campus
      </span>
    </Link>
  );
}

function NavList({ links, pathname, onNavigate }: {
  links: { href: string; label: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`block rounded-md px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-[#17233d] text-white"
                : "text-slate-600 hover:bg-[#17233d]/5 hover:text-[#17233d]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // Close mobile nav on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4] px-4">
        <div className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">Verifying your session…</p>
        </div>
      </div>
    );
  }

  const role = user?.role || "STUDENT";
  const links = navLinks[role] || navLinks.STUDENT;

  return (
    <div className="min-h-screen bg-[#faf8f4] text-slate-900">
      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#faf8f4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileNavOpen((o) => !o)}
              className="lg:hidden rounded-md border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileNavOpen ? (
                  <>
                    <line x1="2" y1="2" x2="16" y2="16" />
                    <line x1="16" y1="2" x2="2" y2="16" />
                  </>
                ) : (
                  <>
                    <line x1="2" y1="5" x2="16" y2="5" />
                    <line x1="2" y1="9" x2="16" y2="9" />
                    <line x1="2" y1="13" x2="16" y2="13" />
                  </>
                )}
              </svg>
            </button>
            <Wordmark />
            <span className="hidden h-5 w-px bg-slate-300 sm:block" />
            <p className="hidden text-sm font-medium text-slate-500 sm:block">
              {roleLabel[role] ?? "Student"} Portal
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block rounded-md bg-white px-4 py-2 text-sm text-slate-700 border border-slate-200">
              <p className="font-semibold leading-tight">{user?.name}</p>
              <p className="text-slate-500 text-xs">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-[#17233d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f1729] whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Wordmark />
        </div>
        <div className="overflow-y-auto p-4 space-y-1">
          <p className="px-1 mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
          <NavList links={links} pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 p-4">
          <p className="text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
      </aside>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block space-y-6 self-start sticky top-24">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="px-1 mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
            <div className="space-y-1">
              <NavList links={links} pathname={pathname} />
            </div>
          </div>

          <div className="rounded-md border border-[#17233d]/10 bg-[#17233d]/[0.04] p-4">
            <p className="font-display text-sm text-[#17233d]">Circuit Campus</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              A school portal for JSS1 to SS3 — one login for every class.
            </p>
          </div>
        </aside>

        <main className="min-w-0 rounded-md border border-slate-200 bg-white p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
