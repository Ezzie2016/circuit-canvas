"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "STUDENT",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      await response.json();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.3fr_0.95fr]">
        <aside className="relative flex items-center justify-center bg-[#1d6d58] px-6 py-12 lg:px-16">
          <div className="max-w-xl space-y-10">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 shadow-sm">
              <span className="text-lg font-semibold text-emerald-100">Circuit Campus</span>
              <span className="rounded-xl border border-emerald-200/30 bg-emerald-200/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-emerald-200">
                Live portal demo
              </span>
            </div>

            <div className="space-y-5">
              <p className="inline-flex rounded-xl border border-emerald-200/20 bg-emerald-200/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-200">
                Learning management
              </p>
              <h1 className="text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                Courses, assignments, grades, and class links in one calm workspace.
              </h1>
              <p className="max-w-xl text-base leading-8 text-emerald-100/85 md:text-lg">
                Students enroll and submit work. Teachers create courses, post assignments, add meeting links, and review submissions. Admins see the health of the school at a glance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Role dashboards</p>
                <p className="mt-3 text-2xl font-semibold text-white">3</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Active assignments</p>
                <p className="mt-3 text-2xl font-semibold text-white">2</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Reviewed grade</p>
                <p className="mt-3 text-2xl font-semibold text-white">1</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center bg-slate-50 px-6 py-12 text-slate-900 lg:px-16">
          <div className="w-full max-w-md rounded-[1.75rem] bg-white p-10 shadow-[0_40px_80px_rgba(15,23,42,0.12)]">
            <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
                <Link
                  href="/login"
                  className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex-1 rounded-xl bg-[#1d6d58] px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                Create your account
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">Register and join Circuit Campus</h2>
              <p className="text-sm text-slate-500">
                Select your role and create a new account to access courses, assignments, and learning workflows.
              </p>
              <p className="text-sm text-slate-400">Already have an account? Sign in to continue.</p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Taylor Brooks"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@campus.edu"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-emerald-100"
                />
              </div>



              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1d6d58] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#124e40] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account? <Link href="/login" className="font-semibold text-[#1d6d58] hover:underline">Sign in here</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
