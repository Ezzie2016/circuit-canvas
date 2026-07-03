"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm max-w-md w-full">
        <p className="text-sm uppercase tracking-[0.25em] text-red-500 font-semibold">Error</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-slate-500">
          An unexpected error occurred. Try refreshing the page or going back.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-slate-400 font-mono">ID: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-2xl bg-[#1d6d58] px-6 py-3 text-sm font-semibold text-white hover:bg-[#124e40] transition"
          >
            Try Again
          </button>
          <Link
            href="/login"
            className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
