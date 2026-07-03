import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma, verifyJwt } from "@/lib/auth";
import { sendTeacherInviteEmail } from "@/lib/emailService";

/**
 * Admin: invite a teacher (teacher will set their own password via invite token).
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name } = body as { email?: string; name?: string };

    if (!email || !name) {
      return NextResponse.json({ error: "Missing email or name" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create invite token (short-lived)
    const inviteId = crypto.randomBytes(16).toString("hex");

    // NOTE: Without DB-backed invite table, we store the invite token hash inside a new user status.
    // This implementation keeps DB changes minimal by creating the teacher user as INACTIVE with role TEACHER,
    // and storing inviteId into a JWT-signed token.
    //
    // Teacher must call /api/teacher/invites/accept to activate and set password.

    const inviteToken = jwt.sign(
      {
        inviteId,
        email,
        name,
        role: "TEACHER",
        type: "TEACHER_INVITE",
      },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "1d" },
    );

    // Create user as inactive teacher (password set at acceptance)
    // We temporarily set a random password; it will be replaced on acceptance.
    const tempPassword = crypto.randomBytes(24).toString("hex");
    const hashedTemp = crypto
      .createHash("sha256")
      .update(tempPassword)
      .digest("hex");

    await prisma.user.create({
      data: {
        email,
        name,
        role: "TEACHER",
        status: "INACTIVE",
        // register/login expect bcrypt hash. We'll store a bcrypt-compatible placeholder
        // by just saving the sha256 string; acceptance will overwrite.
        password: hashedTemp,
      },
    });

    const inviteUrl = `${process.env.APP_URL || "http://localhost:3001"}/teacher/accept-invite?token=${encodeURIComponent(inviteToken)}`;

    void sendTeacherInviteEmail(email, name, inviteUrl).catch(() => undefined);

    return NextResponse.json({ inviteId, email, inviteUrl }, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher invite:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}

