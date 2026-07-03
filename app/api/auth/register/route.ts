import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { sendRegistrationEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Only students can register publicly.
    if (role !== "STUDENT") {
      return NextResponse.json({ error: "Only student registration is allowed" }, { status: 403 });
    }

    if (!email || !password || !name || !role) {

      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const user = await registerUser(email, password, name, role);

    // Send registration email without blocking the response
    void sendRegistrationEmail(email, name, role).catch((emailError) => {
      console.error("Email sending failed:", emailError);
    });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
