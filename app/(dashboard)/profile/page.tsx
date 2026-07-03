"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  TEACHER: "bg-blue-100 text-blue-700",
  STUDENT: "bg-green-100 text-green-700",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Name form
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameMsg(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile((p) => p ? { ...p, name: data.name } : p);
      setNameMsg({ type: "success", text: "Name updated successfully." });
    } catch (err: unknown) {
      setNameMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to update name" });
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
    } catch (err: unknown) {
      setPasswordMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to change password" });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading profile…</div>;
  if (!profile) return <div className="p-8 text-red-500">Failed to load profile.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-1 text-slate-600">Manage your account details and password.</p>
      </div>

      {/* Account Info */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium text-slate-800">{profile.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-800">{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[profile.role] ?? "bg-slate-100 text-slate-600"}`}>
              {profile.role}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Member since</span>
            <span className="font-medium text-slate-800">
              {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          {profile.role !== "ADMIN" && (
            <p className="text-xs text-slate-400 pt-1">Contact an admin to update your name.</p>
          )}
        </div>
      </div>

      {/* Update Name — admin only */}
      {profile.role === "ADMIN" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Update Name</h2>
          <form onSubmit={handleNameSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1d6d58] focus:outline-none"
              />
            </div>
            {nameMsg && (
              <p className={`text-sm ${nameMsg.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{nameMsg.text}</p>
            )}
            <button
              type="submit"
              disabled={savingName}
              className="rounded-xl bg-[#1d6d58] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50"
            >
              {savingName ? "Saving…" : "Save Name"}
            </button>
          </form>
        </div>
      )}

      {/* Change Password */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1d6d58] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1d6d58] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1d6d58] focus:outline-none"
            />
          </div>
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{passwordMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl bg-[#1d6d58] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50"
          >
            {savingPassword ? "Saving…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
