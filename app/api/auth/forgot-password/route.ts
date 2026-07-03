import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/emailService";

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, type: "PASSWORD_RESET" },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "1h" },
    );

    const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
