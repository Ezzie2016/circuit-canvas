import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json() as { token?: string; password?: string };

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production") as jwt.JwtPayload;
    } catch {
      return NextResponse.json({ error: "Reset link is invalid or has expired" }, { status: 400 });
    }

    if (decoded.type !== "PASSWORD_RESET") {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id as string } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashed = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
