import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("authToken");

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 400 },
    );
  }
}
