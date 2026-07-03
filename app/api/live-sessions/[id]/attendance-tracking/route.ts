import { NextResponse } from "next/server";
import { prisma, verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

// POST: Student joins or leaves a session — records attendance in real time
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can track attendance" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { action } = body; // "join" or "leave"

    if (!action || !["join", "leave"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'join' or 'leave'" }, { status: 400 });
    }

    // Fetch the live session
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found" }, { status: 404 });
    }

    // Check session has not expired (link should be inactive after endsAt)
    const now = new Date();
    if (liveSession.endsAt && now > liveSession.endsAt) {
      return NextResponse.json(
        { error: "This session has ended. Attendance can no longer be recorded." },
        { status: 410 }
      );
    }

    // Verify the student is enrolled in this course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: decoded.id,
          courseId: liveSession.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    if (action === "join") {
      // Upsert: create or update the attendance record for today's session
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Check if an attendance record already exists for this session
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: decoded.id,
          liveSessionId: sessionId,
        },
      });

      if (existingRecord) {
        // Re-joining: update attendedAt timestamp (reset timer)
        const updated = await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            attendedAt: now,
            leftAt: null,
            durationMinutes: null,
            status: "ABSENT", // will be updated to PRESENT on leave if 60+ minutes
          },
        });

        return NextResponse.json({
          recordId: updated.id,
          status: "ABSENT",
          message: "Re-joined session. Attendance timer reset.",
        });
      }

      // Create new attendance record
      const record = await prisma.attendanceRecord.create({
        data: {
          studentId: decoded.id,
          courseId: liveSession.courseId,
          liveSessionId: sessionId,
          date: now,
          attendedAt: now,
          status: "ABSENT", // will be updated to PRESENT on leave
        },
      });

      return NextResponse.json({
        recordId: record.id,
        status: "ABSENT",
        message: "Joined session. Attendance tracking started.",
      });
    }

    if (action === "leave") {
      // Find the attendance record for this session
      const record = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: decoded.id,
          liveSessionId: sessionId,
        },
      });

      if (!record || !record.attendedAt) {
        return NextResponse.json(
          { error: "No active session found. Please join first." },
          { status: 404 }
        );
      }

      const durationMs = now.getTime() - record.attendedAt.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const MINIMUM_MINUTES = 60;
      const attendanceStatus = durationMinutes >= MINIMUM_MINUTES ? "PRESENT" : "ABSENT";

      const updated = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          leftAt: now,
          durationMinutes,
          status: attendanceStatus,
        },
        include: {
          student: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      });

      return NextResponse.json({
        recordId: updated.id,
        status: attendanceStatus,
        durationMinutes,
        minimumRequired: MINIMUM_MINUTES,
        studentName: updated.student.name,
        courseName: updated.course.title,
        message:
          attendanceStatus === "PRESENT"
            ? `Marked PRESENT — attended for ${durationMinutes} minutes.`
            : `Marked ABSENT — attended for only ${durationMinutes} minutes (minimum: ${MINIMUM_MINUTES}).`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error tracking attendance:", error);
    return NextResponse.json({ error: "Failed to track attendance" }, { status: 500 });
  }
}

// GET: Returns the student's current attendance status for this session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can view their attendance" }, { status: 403 });
    }

    const { id: sessionId } = await params;

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: decoded.id,
        liveSessionId: sessionId,
      },
    });

    if (!record) {
      return NextResponse.json({ status: "not-joined", record: null });
    }

    return NextResponse.json({
      status: record.leftAt
        ? record.status === "PRESENT"
          ? "left-present"
          : "left-absent"
        : "joined",
      record: {
        id: record.id,
        status: record.status,
        attendedAt: record.attendedAt?.toISOString(),
        leftAt: record.leftAt?.toISOString(),
        durationMinutes: record.durationMinutes,
        verifiedByTeacher: record.verifiedByTeacher,
        notes: record.notes,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance status:", error);
    return NextResponse.json({ error: "Failed to fetch attendance status" }, { status: 500 });
  }
}
