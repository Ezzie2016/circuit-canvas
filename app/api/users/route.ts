import { NextResponse } from "next/server";
import { getUsers } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role") as "STUDENT" | "TEACHER" | "ADMIN" | null;
  const users = await getUsers(role || undefined);
  return NextResponse.json(users);
}
