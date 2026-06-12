"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        if (data.user) {
          const role = data.user.role.toLowerCase();
          router.replace(`/${role}`);
          return;
        }
      } catch (error) {
        console.error("Auth session check failed", error);
      } finally {
        setChecking(false);
      }
    }

    verifySession();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-500">Checking authentication…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
