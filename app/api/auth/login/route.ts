import { NextRequest, NextResponse } from "next/server";
import { loginUser, JWT_SECRET } from "@/lib/auth";
import { sendLoginNotificationEmail } from "@/lib/emailService";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, selectedRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await loginUser(email, password);

    if (selectedRole && user.role !== selectedRole) {
      return NextResponse.json(
        { error: `Role mismatch: this account is ${user.role.toLowerCase()} only.` },
        { status: 403 },
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Send login notification email without blocking the response
    void sendLoginNotificationEmail(email, user.name).catch((emailError) => {
      console.error("Email sending failed:", emailError);
    });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
