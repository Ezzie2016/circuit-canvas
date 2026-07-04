"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

const ROLE_ORDER = ["ADMIN", "TEACHER", "STUDENT"] as const;
type RoleKey = (typeof ROLE_ORDER)[number];

const ROLE_META: Record<RoleKey, { label: string; dot: string; singular: string }> = {
  ADMIN:   { label: "Admins",   dot: "bg-purple-500", singular: "admin"   },
  TEACHER: { label: "Teachers", dot: "bg-blue-500",   singular: "teacher" },
  STUDENT: { label: "Students", dot: "bg-green-500",  singular: "student" },
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-amber-100 text-amber-700",
};

const PAGE_SIZE = 10;

function UserSection({ role, users }: { role: RoleKey; users: User[] }) {
  const meta = ROLE_META[role];
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // reset page when search changes
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // reset to page 1 on new search
  const handleSearch = (v: string) => {
    setQuery(v);
    setPage(1);
  };

  return (
    <section>
      {/* Section header */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        <h2 className="text-base font-semibold text-slate-700">{meta.label}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {users.length}
        </span>

        {/* Search */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()}…`}
              className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#1d6d58] focus:outline-none w-52"
            />
          </div>
          {query && (
            <button onClick={() => handleSearch("")} className="text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <p className="pl-5 text-sm text-slate-400">No {meta.label.toLowerCase()} yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              No {meta.label.toLowerCase()} match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {slice.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-medium">{user.name}</td>
                      <td className="px-6 py-3.5 text-slate-500">{user.email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[user.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-500">
                  <span>
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={safePage === 1}
                      onClick={() => setPage(safePage - 1)}
                      className="rounded-lg px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-slate-400">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={`rounded-lg px-3 py-1.5 font-medium ${safePage === p ? "bg-[#1d6d58] text-white" : "hover:bg-slate-100 text-slate-600"}`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      disabled={safePage === totalPages}
                      onClick={() => setPage(safePage + 1)}
                      className="rounded-lg px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Single-page footer just showing count */}
              {totalPages === 1 && filtered.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-2.5 text-xs text-slate-400">
                  {filtered.length} {meta.singular}{filtered.length !== 1 ? "s" : ""}
                  {query ? ` matching "${query}"` : ""}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ url: string; email: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteResult(null);
    try {
      const res = await fetch("/api/admin/invites/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      setInviteResult({ url: data.inviteUrl, email: data.email });
      setInviteName("");
      setInviteEmail("");
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  const grouped = ROLE_ORDER.reduce<Record<RoleKey, User[]>>((acc, role) => {
    acc[role] = users.filter((u) => u.role === role);
    return acc;
  }, { ADMIN: [], TEACHER: [], STUDENT: [] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Manage Users</h1>
          <p className="mt-1 text-slate-600">View all platform users and invite teachers.</p>
        </div>
        <button
          onClick={() => { setShowInviteForm(!showInviteForm); setInviteResult(null); setInviteError(null); }}
          className="rounded-xl bg-[#1d6d58] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#124e40]"
        >
          {showInviteForm ? "Cancel" : "+ Invite Teacher"}
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Invite a Teacher</h2>
          <p className="mt-1 text-sm text-slate-500">
            An invite link will be generated. Share it with the teacher so they can set their password and activate their account.
          </p>
          <form onSubmit={handleInvite} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1d6d58] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teacher@example.com"
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1d6d58] focus:outline-none"
              />
            </div>
            {inviteError && <p className="sm:col-span-2 text-sm text-red-600">{inviteError}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={inviting}
                className="rounded-xl bg-[#1d6d58] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50"
              >
                {inviting ? "Sending…" : "Generate Invite Link"}
              </button>
            </div>
          </form>

          {inviteResult && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Invite created for {inviteResult.email}</p>
              <p className="mt-1 text-sm text-emerald-700">Share this link with the teacher to let them set their password:</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={inviteResult.url}
                  className="flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(inviteResult.url)}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-xs text-emerald-600">This link expires in 24 hours.</p>
            </div>
          )}
        </div>
      )}

      {/* User sections */}
      {loadingUsers ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400 shadow-sm">
          Loading users…
        </div>
      ) : (
        <div className="space-y-10">
          {ROLE_ORDER.map((role) => (
            <UserSection key={role} role={role} users={grouped[role]} />
          ))}
        </div>
      )}
    </div>
  );
}
