import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name ?? "",
        role: payload.role,
      },
    },
    { status: 200 },
  );
}
