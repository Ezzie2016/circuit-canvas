import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

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

    const messages = await prisma.courseMessage.findMany({
      where: {
        course: {
          OR: [
            { teacherId: decoded.id },
            { enrollments: { some: { studentId: decoded.id } } },
          ],
        },
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      sender: m.sender.name,
      senderEmail: m.sender.email,
      courseId: m.course.id,
      courseName: m.course.title,
      text: m.body,
      timestamp: m.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const courseId = typeof body.courseId === "string" ? body.courseId : "";

    if (!text || !courseId) {
      return NextResponse.json({ error: "Missing courseId or text" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        teacherId: true,
        enrollments: { where: { studentId: decoded.id }, select: { id: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isTeacherOfCourse = decoded.role === "TEACHER" && course.teacherId === decoded.id;
    const isEnrolledStudent = decoded.role === "STUDENT" && course.enrollments.length > 0;

    if (!isTeacherOfCourse && !isEnrolledStudent) {
      return NextResponse.json({ error: "You do not have access to this course" }, { status: 403 });
    }

    const message = await prisma.courseMessage.create({
      data: {
        body: text,
        senderId: decoded.id,
        courseId,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(
      {
        id: message.id,
        sender: message.sender.name,
        senderEmail: message.sender.email,
        courseId: message.course.id,
        courseName: message.course.title,
        text: message.body,
        timestamp: message.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

}

