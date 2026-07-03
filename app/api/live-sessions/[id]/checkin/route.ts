import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt, prisma } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = verifyJwt(token);
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can check in" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const code: string = body.code ?? "";

  if (!code.trim()) {
    return NextResponse.json({ error: "Check-in code is required" }, { status: 400 });
  }

  const session = await prisma.liveSession.findUnique({
    where: { id },
    select: {
      id: true,
      courseId: true,
      endsAt: true,
      checkInCode: true,
      checkInCodeExpiresAt: true,
    },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (session.endsAt && new Date(session.endsAt) < new Date()) {
    return NextResponse.json({ error: "This session has ended" }, { status: 400 });
  }

  if (!session.checkInCode) {
    return NextResponse.json(
      { error: "No check-in code has been generated yet. Ask your teacher to generate one." },
      { status: 400 }
    );
  }

  if (code.trim().toUpperCase() !== session.checkInCode.toUpperCase()) {
    return NextResponse.json({ error: "Incorrect check-in code. Please try again." }, { status: 400 });
  }

  if (!session.checkInCodeExpiresAt || new Date(session.checkInCodeExpiresAt) < new Date()) {
    return NextResponse.json(
      { error: "This check-in code has expired. Ask your teacher to generate a new one." },
      { status: 400 }
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: user.id, courseId: session.courseId },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 });
  }

  const existing = await prisma.attendanceRecord.findFirst({
    where: { studentId: user.id, liveSessionId: session.id },
  });

  if (existing) {
    if (existing.status === "PRESENT") {
      return NextResponse.json({ success: true, alreadyPresent: true });
    }
    await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        status: "PRESENT",
        attendedAt: existing.attendedAt ?? new Date(),
        notes: "Marked present via check-in code",
        verifiedByTeacher: false,
      },
    });
  } else {
    await prisma.attendanceRecord.create({
      data: {
        status: "PRESENT",
        studentId: user.id,
        courseId: session.courseId,
        liveSessionId: session.id,
        attendedAt: new Date(),
        notes: "Marked present via check-in code",
      },
    });
  }

  return NextResponse.json({ success: true });
}
