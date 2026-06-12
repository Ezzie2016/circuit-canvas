import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
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

    // Get all attendance records for this student across all courses
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: decoded.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        liveSession: {
          select: {
            id: true,
            title: true,
            startsAt: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const formatted = attendanceRecords.map((record) => ({
      id: record.id,
      courseName: record.course.title,
      sessionTitle: record.liveSession?.title || "General Session",
      status: record.status,
      date: record.date.toISOString(),
      attendedAt: record.attendedAt?.toISOString(),
      leftAt: record.leftAt?.toISOString(),
      durationMinutes: record.durationMinutes,
      verifiedByTeacher: record.verifiedByTeacher,
      notes: record.notes,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
