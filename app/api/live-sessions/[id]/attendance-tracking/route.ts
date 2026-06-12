import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import {
  calculateAttendanceDuration,
  autoMarkAttendance,
} from "@/lib/attendanceValidator";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // "join" or "leave"

    if (!action || !["join", "leave"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'join' or 'leave'." },
        { status: 400 }
      );
    }

    // Get the live session
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: params.id },
      include: { course: true },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: "Live session not found" },
        { status: 404 }
      );
    }

    // Verify student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: decoded.id,
        courseId: liveSession.courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Handle join event
    if (action === "join") {
      // Create or update attendance record with join time
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let record = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: decoded.id,
          courseId: liveSession.courseId,
          liveSessionId: params.id,
        },
      });

      if (record && !record.attendedAt) {
        // Update with join time
        record = await prisma.attendanceRecord.update({
          where: { id: record.id },
          data: {
            attendedAt: new Date(),
          },
        });
      } else if (!record) {
        // Create new record with join time
        record = await prisma.attendanceRecord.create({
          data: {
            studentId: decoded.id,
            courseId: liveSession.courseId,
            liveSessionId: params.id,
            attendedAt: new Date(),
            status: "ABSENT", // Will be updated when they leave
            date: new Date(),
          },
        });
      }

      return NextResponse.json({
        message: "Joined live session",
        record,
      });
    }

    // Handle leave event
    if (action === "leave") {
      const record = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: decoded.id,
          courseId: liveSession.courseId,
          liveSessionId: params.id,
        },
      });

      if (!record || !record.attendedAt) {
        return NextResponse.json(
          { error: "No join record found" },
          { status: 400 }
        );
      }

      // Calculate duration and auto-mark attendance
      const leftAt = new Date();
      const durationMinutes = calculateAttendanceDuration(
        record.attendedAt,
        leftAt
      );
      const status = autoMarkAttendance(durationMinutes);

      // Update record with leave time and auto-determined status
      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          leftAt,
          durationMinutes,
          status,
          verifiedByTeacher: false, // Flag for teacher to review
        },
      });

      return NextResponse.json({
        message:
          status === "PRESENT"
            ? "Left session - marked PRESENT"
            : "Left session - attendance too short (less than 60 minutes)",
        durationMinutes,
        status,
        record: updatedRecord,
      });
    }
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}
