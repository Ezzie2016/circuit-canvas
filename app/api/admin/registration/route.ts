import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { getRegistrationOpen, setRegistrationOpen } from "@/lib/registration";

export async function GET() {
  try {
    const open = await getRegistrationOpen();
    return NextResponse.json({ open });
  } catch (err) {
    console.error("Failed to read registration flag:", err);
    return NextResponse.json({ error: "Failed to read registration status" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can update registration status" }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body.open !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await setRegistrationOpen(body.open);
    return NextResponse.json({ open: body.open });
  } catch (err) {
    console.error("Failed to update registration flag:", err);
    return NextResponse.json({ error: "Failed to update registration status" }, { status: 500 });
  }
}
