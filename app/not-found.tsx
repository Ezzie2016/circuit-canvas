"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="rounded-xl border border-slate-200 bg-white p-12 shadow-sm max-w-md w-full">
        <p className="text-sm uppercase tracking-[0.25em] text-[#17233d] font-semibold">404</p>
        <h1 className="font-display mt-4 text-4xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-[#17233d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0f1729] transition"
          >
            Go to Login
          </Link>
          <button
            onClick={() => history.back()}
            className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
