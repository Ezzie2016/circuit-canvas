import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { getRegistrationOpen } from "@/lib/registration";
import { ClassLevel } from "@prisma/client";

const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

function validClassLevel(v: unknown): ClassLevel | undefined {
  if (typeof v === "string" && CLASS_LEVELS.includes(v)) return v as ClassLevel;
  return undefined;
}

export async function GET() {
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

    const isTeacher = decoded.role === "TEACHER";
    const isStudent = decoded.role === "STUDENT";

    // Enrollment counts come from _count; enrollment rows are only loaded where
    // the response needs them: a teacher's own roster, or otherwise just the
    // viewer's own enrollment (to compute `enrolled`).
    const courses = await prisma.course.findMany({
      where: isTeacher ? { teacherId: decoded.id } : undefined,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
        enrollments: {
          where: isTeacher ? undefined : { studentId: decoded.id },
          select: { student: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      code: course.code ?? null,
      classLevel: course.classLevel ?? null,
      departmentId: course.departmentId ?? null,
      departmentName: course.department?.name ?? null,
      description: course.description,
      instructor: course.teacher.name,
      instructorEmail: course.teacher.email,
      teacherId: course.teacherId,
      students: course._count.enrollments,
      enrolled: isStudent && course.enrollments.length > 0,
      studentList: isTeacher ? course.enrollments.map((e) => e.student) : [],
      status: "Open",
      meetingLink: course.meetingLink,
      thumbnail: course.thumbnail,
      createdAt: course.createdAt,
    }));

    return NextResponse.json(formattedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
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
      return NextResponse.json({ error: "Only teachers can create courses" }, { status: 403 });
    }

    const registrationOpen = await getRegistrationOpen();
    if (!registrationOpen) {
      return NextResponse.json({ error: "Course registration is currently closed" }, { status: 403 });
    }

    const body = await request.json();
    const course = await prisma.course.create({
      data: {
        title: body.title || "New Course",
        code: body.code ? String(body.code).trim().toUpperCase() : undefined,
        description: body.description || "",
        meetingLink: body.meetingLink,
        thumbnail: body.thumbnail,
        classLevel: validClassLevel(body.classLevel),
        departmentId: body.departmentId || undefined,
        teacherId: decoded.id,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        id: course.id,
        title: course.title,
        code: course.code ?? null,
        classLevel: course.classLevel ?? null,
        departmentId: course.departmentId ?? null,
        departmentName: course.department?.name ?? null,
        description: course.description,
        instructor: course.teacher.name,
        teacherId: course.teacherId,
        students: 0,
        status: "Open",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
