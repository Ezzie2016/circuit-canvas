import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f3] p-8 text-center">
      <h1 className="text-5xl font-semibold text-[#17233d]">Circuit Canvas</h1>
      <p className="mt-4 max-w-xl text-lg text-[#46534b]">
        A learning portal for students, teachers, and admins.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-[#17233d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0f1729]"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-[#17233d] px-6 py-3 text-sm font-semibold text-[#17233d] hover:bg-[#eef1e9]"
        >
          Register
        </Link>
      </div>
    </main>
  );
}