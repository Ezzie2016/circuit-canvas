// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`font-display flex h-10 w-10 items-center justify-center rounded-md border text-lg font-semibold ${
          dark
            ? "border-white/20 bg-white/5 text-[#d9b877]"
            : "border-[#17233d]/15 bg-[#17233d] text-[#d9b877]"
        }`}
      >
        C
      </span>
      <div className="leading-tight">
        <p className={`font-display text-base font-medium ${dark ? "text-white" : "text-[#17233d]"}`}>
          Circuit Campus
        </p>
        <p className={`text-[11px] uppercase tracking-[0.2em] ${dark ? "text-white/50" : "text-slate-400"}`}>
          JSS1 – SS3
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"Student" | "Teacher" | "Admin">("Student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedRole: selectedRole.toUpperCase() }),
      });

      const contentType = response.headers.get("content-type") || "";
      let responseData:
        | { error?: string; message?: string; user?: { role?: string } }
        | null = null;
      let errorMessage = "Login failed";

      if (contentType.includes("application/json")) {
        responseData = await response.json();
        errorMessage = responseData?.error || responseData?.message || errorMessage;
      } else {
        const text = await response.text();
        errorMessage = text ? text : errorMessage;
      }

      if (!response.ok) {
        throw new Error(errorMessage);
      }

      const roleRedirects: Record<string, string> = {
        Student: "/student",
        Teacher: "/teacher",
        Admin: "/admin",
      };
      const userRole = responseData?.user?.role;
      const normalizedRole =
        typeof userRole === "string"
          ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()
          : undefined;
      const redirectPath = normalizedRole
        ? roleRedirects[normalizedRole] ?? "/"
        : "/";
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#17233d] px-12 py-14 text-white lg:flex xl:px-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          <Wordmark dark />

          <div className="relative max-w-lg space-y-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#d9b877]">
              Est. for the term ahead
            </p>
            <h1 className="font-display text-4xl leading-[1.15] font-normal xl:text-5xl">
              A school portal that stays out of the way.
            </h1>
            <p className="max-w-md text-[15px] leading-7 text-white/60">
              Assignments, grades, live lessons, and attendance — one login for
              every student, teacher, and administrator in the building.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10">
            {[
              ["Roles", "3"],
              ["Class levels", "JSS1–SS3"],
              ["Sign-ins", "Instant"],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#17233d] px-4 py-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{label}</p>
                <p className="font-display mt-2 text-xl">{value}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Wordmark />
            </div>

            <div className="mb-8 flex gap-6 border-b border-slate-200">
              <Link
                href="/login"
                className="border-b-2 border-[#17233d] pb-3 text-sm font-semibold text-[#17233d]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="pb-3 text-sm font-medium text-slate-400 transition hover:text-slate-600"
              >
                Register
              </Link>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-3xl font-normal text-[#17233d]">Welcome back</h2>
              <p className="text-sm text-slate-500">
                Sign in with your school email to reach your dashboard.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  I am signing in as
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["Student", "Teacher", "Admin"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`rounded-md border px-2 py-2.5 text-sm font-medium transition ${
                        selectedRole === role
                          ? "border-[#17233d] bg-[#17233d] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu.ng"
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17233d] focus:ring-2 focus:ring-[#17233d]/10"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-xs font-medium text-[#17233d]/70 hover:text-[#17233d]">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17233d] focus:ring-2 focus:ring-[#17233d]/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#17233d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1729] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              New student?{" "}
              <Link href="/register" className="font-semibold text-[#17233d] hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
