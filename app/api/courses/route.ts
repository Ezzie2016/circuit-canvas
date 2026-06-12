import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { getRegistrationOpen } from "@/lib/registration";

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

    let courses;
    if (decoded.role === "TEACHER") {
      courses = await prisma.course.findMany({
        where: { teacherId: decoded.id },
        include: {
          enrollments: { include: { student: { select: { id: true, name: true, email: true } } } },
          assignments: true,
          teacher: { select: { id: true, name: true, email: true } },
        },
      });
    } else if (decoded.role === "STUDENT") {
      courses = await prisma.course.findMany({
        include: {
          enrollments: { include: { student: { select: { id: true, name: true, email: true } } } },
          teacher: { select: { id: true, name: true, email: true } },
          assignments: true,
        },
      });
    } else {
      courses = await prisma.course.findMany({
        include: {
          enrollments: true,
          teacher: { select: { id: true, name: true, email: true } },
        },
      });
    }

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.teacher.name,
      instructorEmail: course.teacher.email,
      teacherId: course.teacherId,
      students: course.enrollments.length,
      enrolled:
        decoded.role === "STUDENT"
          ? course.enrollments.some((enrollment: any) => (enrollment.student?.id ?? enrollment.studentId) === decoded.id)
          : false,
      studentList: (course.enrollments || []).map((e: any) => e.student ?? { id: e.studentId, name: "", email: "" }),
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

    // prevent creating new courses if registration globally closed
    const registrationOpen = await getRegistrationOpen();
    if (!registrationOpen) {
      return NextResponse.json({ error: "Course registration is currently closed" }, { status: 403 });
    }

    const body = await request.json();
    const course = await prisma.course.create({
      data: {
        title: body.title || "New Course",
        description: body.description || "",
        meetingLink: body.meetingLink,
        thumbnail: body.thumbnail,
        teacherId: decoded.id,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        id: course.id,
        title: course.title,
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

