import { NextRequest, NextResponse } from "next/server";
import { registerUser, createNotification } from "@/lib/auth";
import { sendRegistrationEmail } from "@/lib/emailService";
import { getRegistrationOpen } from "@/lib/registration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Only students can register publicly.
    if (role !== "STUDENT") {
      return NextResponse.json({ error: "Only student registration is allowed" }, { status: 403 });
    }

    const isOpen = await getRegistrationOpen();
    if (!isOpen) {
      return NextResponse.json({ error: "Registration is currently closed. Contact your administrator." }, { status: 403 });
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

    // Notify admin of new registration (non-blocking)
    void createNotification(
      "New student registered",
      `${name} (${email}) just created a student account.`,
      "ADMIN",
    ).catch(() => {});

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
