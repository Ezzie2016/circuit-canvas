import { FormEvent } from "react";
import Link from "next/link";

type AuthMode = "login" | "register";
type Role = "Student" | "Teacher" | "Admin";

const roles: Role[] = ["Student", "Teacher", "Admin"];

export default function AuthScreen({
  authMode,
  notice,
  selectedRole,
  onAuth,
  onModeChange,
  onRoleChange,
}: {
  authMode: AuthMode;
  notice: string;
  selectedRole: Role;
  onAuth: (event: FormEvent<HTMLFormElement>) => void;
  onModeChange: (mode: AuthMode) => void;
  onRoleChange: (role: Role) => void;
}) {
  return (
    <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-5 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
      <div className="flex min-h-[360px] flex-col justify-between rounded-lg bg-[#153f3a] p-8 text-white shadow-sm lg:p-10">
        <nav className="flex items-center justify-between">
          <div className="text-lg font-semibold">Circuit Campus</div>

          <div className="hidden items-center gap-2 text-sm text-white/80 sm:flex">
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/student">
              Student
            </Link>
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/teacher">
              Teacher
            </Link>
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/admin">
              Admin
            </Link>
          </div>
        </nav>

        <div className="max-w-2xl py-16">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-[#b8d8cb]">
            Learning management
          </p>

          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Courses, assignments, grades, and class links in one calm workspace.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/76 md:text-lg">
            Students enroll and submit work. Teachers create courses, post assignments,
            add meeting links, and review submissions. Admins see the health of the school at a glance.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-white/84 sm:grid-cols-3">
          <div className="rounded-md bg-white/10 p-4">
            <strong className="block text-2xl text-white">3</strong>
            Role dashboards
          </div>

          <div className="rounded-md bg-white/10 p-4">
            <strong className="block text-2xl text-white">2</strong>
            Active assignments
          </div>

          <div className="rounded-md bg-white/10 p-4">
            <strong className="block text-2xl text-white">1</strong>
            Reviewed grade
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className="w-full rounded-lg border border-[#d8ddd2] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex rounded-md bg-[#eef1e9] p-1">
            {(["login", "register"] as AuthMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange(mode)}
                className={`h-11 flex-1 rounded px-4 text-sm font-semibold capitalize transition ${
                  authMode === mode
                    ? "bg-white text-[#153f3a] shadow-sm"
                    : "text-[#58645d] hover:text-[#17211b]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-[#667068]">{notice}</p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onRoleChange(role)}
                className={`rounded-md border px-3 py-3 text-sm font-semibold transition ${
                  selectedRole === role
                    ? "border-[#153f3a] bg-[#e1f1ea] text-[#153f3a]"
                    : "border-[#d8ddd2] text-[#58645d] hover:border-[#9db2a8]"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={onAuth}>
            {authMode === "register" && (
              <input
                name="name"
                placeholder="Full name"
                className="w-full rounded-md border p-3 text-sm"
              />
            )}

            <input
              name="email"
              type="email"
              placeholder={
                selectedRole === "Student"
                  ? "student@campus.edu"
                  : selectedRole === "Teacher"
                  ? "teacher@campus.edu"
                  : "admin@campus.edu"
              }
              className="w-full rounded-md border p-3 text-sm"
            />

            <input
              name="password"
              type="password"
              placeholder="Any password works"
              className="w-full rounded-md border p-3 text-sm"
            />

            <button
              type="submit"
              className="h-12 w-full rounded-md bg-[#153f3a] px-5 text-sm font-semibold text-white"
            >
              Continue as {selectedRole}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}