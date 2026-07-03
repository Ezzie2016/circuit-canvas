"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Invite form state
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
      // Reload users list
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    TEACHER: "bg-blue-100 text-blue-700",
    STUDENT: "bg-green-100 text-green-700",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    INACTIVE: "bg-amber-100 text-amber-700",
  };

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
            {inviteError && (
              <p className="sm:col-span-2 text-sm text-red-600">{inviteError}</p>
            )}
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

          {/* Invite Result */}
          {inviteResult && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                Invite created for {inviteResult.email}
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                Share this link with the teacher to let them set their password:
              </p>
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

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-sm text-slate-500">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {loadingUsers ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading users…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-slate-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[user.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
