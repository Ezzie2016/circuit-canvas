"use client";

import { useState, useEffect } from "react";
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/registration")
      .then((r) => r.json())
      .then((d) => setRegistrationOpen(d.open ?? true))
      .catch(() => setRegistrationOpen(true));
  }, []);

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
          ...(matricNumber.trim() ? { matricNumber: matricNumber.trim() } : {}),
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
              Student registration
            </p>
            <h1 className="font-display text-4xl leading-[1.15] font-normal xl:text-5xl">
              Your courses, assignments, and grades — ready in a minute.
            </h1>
            <p className="max-w-md text-[15px] leading-7 text-white/60">
              Create your account, enroll in classes, and submit work. Teachers
              grade it, and you&apos;ll see the result the moment it&apos;s posted.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10">
            {[
              ["Enroll", "Any course"],
              ["Submit", "Assignments"],
              ["Join", "Live classes"],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#17233d] px-4 py-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{label}</p>
                <p className="font-display mt-2 text-lg">{value}</p>
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
                className="pb-3 text-sm font-medium text-slate-400 transition hover:text-slate-600"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="border-b-2 border-[#17233d] pb-3 text-sm font-semibold text-[#17233d]"
              >
                Register
              </Link>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-3xl font-normal text-[#17233d]">Create your account</h2>
              <p className="text-sm text-slate-500">
                Student sign-up only — teachers and admins are added by the school.
              </p>
            </div>

            {registrationOpen === false ? (
              <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-4 text-center">
                <p className="text-sm font-semibold text-amber-800">Registration is closed</p>
                <p className="mt-1 text-sm text-amber-700">
                  New sign-ups aren&apos;t being accepted right now. Contact your administrator.
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Taylor Brooks"
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17233d] focus:ring-2 focus:ring-[#17233d]/10"
                    />
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
                    <label htmlFor="matricNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Matric number <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="matricNumber"
                      type="text"
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      placeholder="e.g. JSS1/2026/001"
                      className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17233d] focus:ring-2 focus:ring-[#17233d]/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        required
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17233d] focus:ring-2 focus:ring-[#17233d]/10"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Confirm
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        required
                        className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#17233d] focus:ring-2 focus:ring-[#17233d]/10"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-[#17233d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1729] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Creating account…" : "Create account"}
                  </button>
                </form>
              </>
            )}

            <p className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#17233d] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
