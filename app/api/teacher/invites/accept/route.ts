import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body as { token?: string; password?: string };

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production") as jwt.JwtPayload;
    } catch {
      return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 400 });
    }

    if (!decoded || decoded.type !== "TEACHER_INVITE" || decoded.role !== "TEACHER") {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    const email = String(decoded.email || "");
    if (!email) {
      return NextResponse.json({ error: "Invalid invite payload" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "Invite user not found" }, { status: 404 });
    }

    const hashed = await hashPassword(password);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        status: "ACTIVE",
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}

