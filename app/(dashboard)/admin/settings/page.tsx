"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [userChecked, setUserChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionJson = await sessionRes.json();
        if (!sessionJson.user) {
          router.push('/login');
          return;
        }
        if (sessionJson.user.role !== 'ADMIN') {
          router.push(`/${sessionJson.user.role.toLowerCase()}`);
          return;
        }
        setIsAdmin(true);

        const res = await fetch('/api/admin/registration');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load registration status');
        setOpen(Boolean(json.open));
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to load settings');
      } finally {
        setUserChecked(true);
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function toggle() {
    if (open === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/registration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open: !open }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update');
      setOpen(Boolean(json.open));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update registration status');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading settings…</div>;
  if (!userChecked || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Admin Settings</h1>
        <p className="mt-2 text-slate-600">Control system-wide settings for course registration.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Course Registration</h2>
        <p className="mt-2 text-sm text-slate-600">When closed, teachers cannot create courses and students cannot enroll in new courses.</p>

        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm font-medium">Status:</div>
          <div className={`px-3 py-1 rounded ${open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {open ? 'Open' : 'Closed'}
          </div>
        </div>

        {error ? <div className="mt-4 text-sm text-red-700">{error}</div> : null}

        <div className="mt-6">
          <button
            onClick={toggle}
            disabled={saving}
            className={`rounded-xl px-5 py-3 text-sm font-semibold text-white ${saving ? 'bg-slate-300' : open ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {saving ? 'Saving…' : open ? 'Close Registration' : 'Open Registration'}
          </button>
        </div>
      </div>
    </div>
  );
}
