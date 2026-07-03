import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let records;
    if (decoded.role === "STUDENT") {
      records = await prisma.attendanceRecord.findMany({
        where: { studentId: decoded.id, ...(courseId ? { courseId } : {}) },
        include: {
          student: true,
          course: true,
        },
      });
    } else if (decoded.role === "TEACHER") {
      records = await prisma.attendanceRecord.findMany({
        where: { course: { teacherId: decoded.id }, ...(courseId ? { courseId } : {}) },
        include: {
          student: true,
          course: true,
        },
      });
    } else {
      records = await prisma.attendanceRecord.findMany({
        where: courseId ? { courseId } : {},
        include: {
          student: true,
          course: true,
        },
      });
    }

    const formatted = records.map((r) => ({
      id: r.id,
      course: r.course.title,
      student: r.student.name,
      studentId: r.student.id,
      status: r.status,
      date: r.date.toISOString().split("T")[0],
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can update attendance" }, { status: 403 });
    }

    const body = await request.json();
    const record = await prisma.attendanceRecord.update({
      where: { id: body.id },
      data: { status: body.status },
      include: { student: true, course: true },
    });

    return NextResponse.json({
      id: record.id,
      course: record.course.title,
      student: record.student.name,
      status: record.status,
      date: record.date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can record attendance" }, { status: 403 });
    }

    const body = await request.json();
    const record = await prisma.attendanceRecord.create({
      data: {
        studentId: body.studentId,
        courseId: body.courseId,
        status: body.status || "PRESENT",
        date: body.date ? new Date(body.date) : new Date(),
      },
      include: { student: true, course: true },
    });

    return NextResponse.json(
      {
        id: record.id,
        course: record.course.title,
        student: record.student.name,
        status: record.status,
        date: record.date.toISOString().split("T")[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
