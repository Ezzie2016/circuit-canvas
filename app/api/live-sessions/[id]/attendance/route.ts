import { NextResponse } from "next/server";
import { prisma, verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

// GET: Teacher gets full attendance list for a specific live session
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
    if (!decoded || decoded.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can view session attendance" },
        { status: 403 }
      );
    }

    const { id: sessionId } = await params;

    // Load the live session and verify it belongs to this teacher
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        attendanceRecords: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found" }, { status: 404 });
    }

    if (liveSession.course.teacherId !== decoded.id) {
      return NextResponse.json(
        { error: "You are not the teacher of this course" },
        { status: 403 }
      );
    }

    // Build the full attendance list from all enrolled students
    const enrolledStudents = liveSession.course.enrollments.map((e) => e.student);
    const attendanceMap = new Map(
      liveSession.attendanceRecords.map((r) => [r.studentId, r])
    );

    const attendanceList = enrolledStudents.map((student) => {
      const record = attendanceMap.get(student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        status: (record?.status || "ABSENT") as "PRESENT" | "ABSENT",
        attendedAt: record?.attendedAt?.toISOString() || null,
        leftAt: record?.leftAt?.toISOString() || null,
        durationMinutes: record?.durationMinutes || null,
        verifiedByTeacher: record?.verifiedByTeacher || false,
        notes: record?.notes || "",
        recordId: record?.id || null,
      };
    });

    return NextResponse.json({
      liveSessionId: sessionId,
      courseId: liveSession.courseId,
      sessionTitle: liveSession.title,
      sessionStartsAt: liveSession.startsAt.toISOString(),
      sessionEndsAt: liveSession.endsAt?.toISOString() || null,
      attendanceList,
    });
  } catch (error) {
    console.error("Error fetching session attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch session attendance" },
      { status: 500 }
    );
  }
}

// PATCH: Teacher overrides attendance for a student — sets status, notes, verifiedByTeacher
export async function PATCH(
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
    if (!decoded || decoded.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can override attendance" },
        { status: 403 }
      );
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { studentId, status, notes, durationMinutes } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    // Verify this session belongs to the teacher
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found" }, { status: 404 });
    }

    if (liveSession.course.teacherId !== decoded.id) {
      return NextResponse.json(
        { error: "You are not the teacher of this course" },
        { status: 403 }
      );
    }

    // Find or create the attendance record
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: { studentId, liveSessionId: sessionId },
    });

    let record;
    if (existingRecord) {
      // Update existing record — teacher override sets verifiedByTeacher: true
      record = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes }),
          ...(durationMinutes !== undefined && { durationMinutes }),
          verifiedByTeacher: true, // Always mark as verified when teacher edits
        },
        include: {
          student: { select: { name: true, email: true } },
        },
      });
    } else {
      // Create new record (teacher manually adding attendance for a student who didn't join)
      record = await prisma.attendanceRecord.create({
        data: {
          studentId,
          courseId: liveSession.courseId,
          liveSessionId: sessionId,
          date: new Date(),
          status: status || "PRESENT",
          notes: notes || "",
          durationMinutes: durationMinutes || null,
          verifiedByTeacher: true,
        },
        include: {
          student: { select: { name: true, email: true } },
        },
      });
    }

    return NextResponse.json({
      recordId: record.id,
      studentId,
      studentName: record.student.name,
      status: record.status,
      notes: record.notes,
      durationMinutes: record.durationMinutes,
      verifiedByTeacher: record.verifiedByTeacher,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}
