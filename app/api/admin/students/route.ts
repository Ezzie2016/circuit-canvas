import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma, verifyJwt } from "@/lib/auth";
import { sendStudentInviteEmail } from "@/lib/emailService";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, matricNumber } = body as { email?: string; name?: string; matricNumber?: string };

    if (!email || !name) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    if (matricNumber) {
      const existingMatric = await prisma.user.findUnique({ where: { matricNumber } });
      if (existingMatric) {
        return NextResponse.json({ error: "A student with this matric number already exists" }, { status: 409 });
      }
    }

    const inviteToken = jwt.sign(
      { email, name, role: "STUDENT", type: "STUDENT_INVITE", matricNumber: matricNumber || null },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "1d" },
    );

    const tempPassword = crypto.randomBytes(24).toString("hex");
    const hashedTemp = crypto.createHash("sha256").update(tempPassword).digest("hex");

    await prisma.user.create({
      data: {
        email,
        name,
        role: "STUDENT",
        status: "INACTIVE",
        password: hashedTemp,
        ...(matricNumber ? { matricNumber } : {}),
      },
    });

    const inviteUrl = `${process.env.APP_URL || "http://localhost:3001"}/student/accept-invite?token=${encodeURIComponent(inviteToken)}`;

    void sendStudentInviteEmail(email, name, inviteUrl).catch(() => undefined);

    return NextResponse.json({ email, inviteUrl }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
