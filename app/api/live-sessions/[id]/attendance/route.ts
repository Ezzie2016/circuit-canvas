import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[Attendance API] GET request for session: ${params.id}`);
    
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      console.log("[Attendance API] No auth token found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      console.log("[Attendance API] Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log(`[Attendance API] User: ${decoded.id}, Role: ${decoded.role}`);

    // Get the live session and verify teacher owns it
    console.log("[Attendance API] Fetching live session...");
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: params.id },
      include: {
        course: true,
      },
    });

    if (!liveSession) {
      console.log("[Attendance API] Live session not found");
      return NextResponse.json({ error: "Live session not found" }, { status: 404 });
    }

    console.log(`[Attendance API] Live session found: ${liveSession.title}, Teacher ID: ${liveSession.course.teacherId}`);

    if (decoded.role !== "TEACHER" || liveSession.course.teacherId !== decoded.id) {
      console.log("[Attendance API] Forbidden - user is not the course teacher");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all enrolled students and their attendance for this session
    console.log("[Attendance API] Fetching enrollments...");
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: liveSession.courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`[Attendance API] Found ${enrollments.length} enrollments`);

    console.log("[Attendance API] Fetching attendance records...");
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        liveSessionId: params.id,
        courseId: liveSession.courseId,
      },
    });

    console.log(`[Attendance API] Found ${attendanceRecords.length} attendance records`);

    // Build attendance list with student details
    const attendanceList = enrollments.map((enrollment) => {
      const record = attendanceRecords.find(
        (r) => r.studentId === enrollment.studentId
      );

      return {
        studentId: enrollment.studentId,
        studentName: enrollment.student.name,
        studentEmail: enrollment.student.email,
        status: record?.status || "ABSENT",
        attendedAt: record?.attendedAt?.toISOString() || null,
        leftAt: record?.leftAt?.toISOString() || null,
        durationMinutes: record?.durationMinutes || null,
        verifiedByTeacher: record?.verifiedByTeacher || false,
        notes: record?.notes || "",
        recordId: record?.id || null,
      };
    });

    console.log("[Attendance API] Attendance list built successfully");

    const response = {
      liveSessionId: params.id,
      courseId: liveSession.courseId,
      sessionTitle: liveSession.title,
      sessionStartsAt: liveSession.startsAt.toISOString(),
      attendanceList,
    };

    console.log("[Attendance API] Returning response with", attendanceList.length, "students");
    return NextResponse.json(response);
  } catch (error) {
    console.error("[Attendance API] Error fetching attendance:", error);
    if (error instanceof Error) {
      console.error("[Attendance API] Error message:", error.message);
      console.error("[Attendance API] Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "Failed to fetch attendance", 
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { studentId, status, attendedAt, leftAt, notes } = body;

    // Get the live session and verify teacher owns it
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: params.id },
      include: { course: true },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found" }, { status: 404 });
    }

    if (decoded.role !== "TEACHER" || liveSession.course.teacherId !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate duration if both times provided
    let durationMinutes: number | null = null;
    if (attendedAt && leftAt) {
      const joinTime = new Date(attendedAt);
      const leaveTime = new Date(leftAt);
      durationMinutes = Math.round(
        (leaveTime.getTime() - joinTime.getTime()) / (1000 * 60)
      );
    }

    // Find or create attendance record
    let record = await prisma.attendanceRecord.findFirst({
      where: {
        studentId,
        courseId: liveSession.courseId,
        liveSessionId: params.id,
      },
    });

    if (record) {
      // Update existing record using composite key
      record = await prisma.attendanceRecord.update({
        where: {
          studentId_courseId_liveSessionId: {
            studentId,
            courseId: liveSession.courseId,
            liveSessionId: params.id,
          },
        },
        data: {
          status,
          attendedAt: attendedAt ? new Date(attendedAt) : undefined,
          leftAt: leftAt ? new Date(leftAt) : undefined,
          durationMinutes,
          verifiedByTeacher: true,
          notes: notes || null,
        },
      });
    } else {
      // Create new record
      record = await prisma.attendanceRecord.create({
        data: {
          studentId,
          courseId: liveSession.courseId,
          liveSessionId: params.id,
          status,
          attendedAt: attendedAt ? new Date(attendedAt) : null,
          leftAt: leftAt ? new Date(leftAt) : null,
          durationMinutes,
          verifiedByTeacher: true,
          notes: notes || null,
          date: new Date(),
        },
      });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error updating attendance:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "Failed to update attendance",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
