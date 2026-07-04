import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, verifyJwt, createNotification } from "@/lib/auth";
import { getRegistrationOpen } from "@/lib/registration";

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const params = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        enrollments: { include: { student: { select: { id: true } } } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (decoded.role === "TEACHER" && course.teacherId !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const enrolled = course.enrollments.some((enrollment) => enrollment.student.id === decoded.id);

    return NextResponse.json({
      id: course.id,
      title: course.title,
      code: course.code ?? null,
      description: course.description,
      instructor: course.teacher.name,
      instructorEmail: course.teacher.email,
      teacherId: course.teacherId,
      students: course.enrollments.length,
      enrolled,
      status: "Open",
      meetingLink: course.meetingLink,
      thumbnail: course.thumbnail,
      createdAt: course.createdAt,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const params = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can enroll in courses" }, { status: 403 });
    }

    // prevent enrollment when registration is closed
    const registrationOpen = await getRegistrationOpen();
    if (!registrationOpen) {
      return NextResponse.json({ error: "Course registration is currently closed" }, { status: 403 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: { teacher: true, enrollments: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const alreadyEnrolled = course.enrollments.some((enrollment) => enrollment.studentId === decoded.id);
    if (alreadyEnrolled) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 200 });
    }

    await prisma.enrollment.create({
      data: {
        studentId: decoded.id,
        courseId: params.courseId,
      },
    });

    const responsePayload = {
      id: course.id,
      title: course.title,
      instructor: course.teacher.name,
      teacherId: course.teacherId,
      students: course.enrollments.length + 1,
      enrolled: true,
      status: "Open",
    };

    // Fire-and-forget notifications so enrollment succeeds even if notifications fail.
    void (async () => {
      try {
        await createNotification(
          "Course enrollment confirmed",
          `You are now enrolled in ${course.title}.`,
          "STUDENT",
          decoded.id,
        );
      } catch (notificationError) {
        console.error("Failed to send student enrollment notification:", notificationError);
      }

      try {
        await createNotification(
          "Student enrolled",
          `${decoded.name || decoded.email} enrolled in ${course.title}.`,
          "TEACHER",
          course.teacherId,
        );
      } catch (notificationError) {
        console.error("Failed to send teacher enrollment notification:", notificationError);
      }
    })();

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return NextResponse.json({ error: "Failed to enroll in course" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const params = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "Only authorized teachers or admins can edit courses" }, { status: 403 });
    }

    const course = await prisma.course.findUnique({ where: { id: params.courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (decoded.role === "TEACHER" && course.teacherId !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.title === "string") updateData.title = body.title;
    if (typeof body.code === "string") updateData.code = body.code.trim().toUpperCase() || null;
    if (typeof body.description === "string") updateData.description = body.description;
    if (typeof body.meetingLink === "string") updateData.meetingLink = body.meetingLink;
    if (typeof body.thumbnail === "string") updateData.thumbnail = body.thumbnail;
    if (decoded.role === "ADMIN" && typeof body.teacherId === "string") {
      updateData.teacherId = body.teacherId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid course fields provided" }, { status: 400 });
    }

    const updated = await prisma.course.update({
      where: { id: params.courseId },
      data: updateData,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        enrollments: { include: { student: { select: { id: true } } } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      code: updated.code ?? null,
      description: updated.description,
      instructor: updated.teacher.name,
      instructorEmail: updated.teacher.email,
      teacherId: updated.teacherId,
      students: updated.enrollments.length,
      status: "Open",
      meetingLink: updated.meetingLink,
      thumbnail: updated.thumbnail,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const params = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        teacher: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (decoded.role === "TEACHER" && course.teacherId !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({ where: { courseId: params.courseId }, select: { id: true } });
    const assignmentIds = assignments.map((assignment) => assignment.id);

    if (assignmentIds.length > 0) {
      await prisma.submission.deleteMany({ where: { assignmentId: { in: assignmentIds } } });
      await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
    }

    await prisma.liveSession.deleteMany({ where: { courseId: params.courseId } });
    await prisma.courseResource.deleteMany({ where: { courseId: params.courseId } });
    await prisma.courseMessage.deleteMany({ where: { courseId: params.courseId } });
    await prisma.attendanceRecord.deleteMany({ where: { courseId: params.courseId } });
    await prisma.enrollment.deleteMany({ where: { courseId: params.courseId } });
    await prisma.course.delete({ where: { id: params.courseId } });

    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
