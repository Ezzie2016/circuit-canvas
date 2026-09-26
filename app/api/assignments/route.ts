import { NextResponse } from "next/server";
import { prisma, verifyJwt, createNotification, createNotificationsForRecipients } from "@/lib/auth";
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

    const isStudent = decoded.role === "STUDENT";
    const where = isStudent
      ? { course: { enrollments: { some: { studentId: decoded.id } } } }
      : decoded.role === "TEACHER"
        ? { course: { teacherId: decoded.id } }
        : undefined;

    // Students need their own submission's status; staff only need a count.
    // Never pull every submission (with response text) just to count it.
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: { select: { id: true, title: true } },
        submissions: isStudent
          ? { where: { studentId: decoded.id }, select: { status: true } }
          : false,
        _count: isStudent ? false : { select: { submissions: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = assignments.map((a) => {
      // Students: status of their own submission. Staff: whether the
      // assignment has any submissions (the teacher list shows "Has
      // submissions" for "Submitted").
      const own = a.submissions?.[0];
      const status = isStudent
        ? !own ? "Pending" : own.status === "REVIEWED" ? "Graded" : "Submitted"
        : a._count.submissions > 0 ? "Submitted" : "Pending";
      return {
        id: a.id,
        title: a.title,
        course: a.course.title,
        courseId: a.course.id,
        dueDate: a.dueDate.toISOString().split("T")[0],
        status,
        instructions: a.instructions,
        totalMarks: a.totalMarks,
        type: a.type,
        submissionCount: isStudent ? (a.submissions?.length ?? 0) : a._count.submissions,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
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
      return NextResponse.json({ error: "Only teachers can create assignments" }, { status: 403 });
    }

    const body = await request.json();
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      select: { teacherId: true, enrollments: { select: { studentId: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.teacherId !== decoded.id) {
      return NextResponse.json({ error: "You can only post assignments to your own courses" }, { status: 403 });
    }

    const validTypes = ["ASSIGNMENT", "QUIZ", "MID_SEMESTER", "EXAM"];
    const assignmentType = validTypes.includes(body.type) ? body.type : "ASSIGNMENT";

    const assignment = await prisma.assignment.create({
      data: {
        title: body.title,
        instructions: body.instructions || "",
        dueDate: new Date(body.dueDate),
        totalMarks: typeof body.totalMarks === "number" ? body.totalMarks : Number(body.totalMarks || 10),
        type: assignmentType,
        courseId: body.courseId,
      },
      include: {
        course: { select: { id: true, title: true } },
      },
    });


    const dueDateText = assignment.dueDate.toISOString().split("T")[0];
    const message = `New assignment posted for ${assignment.course.title}: ${assignment.title} is due ${dueDateText}.`;

    if (course.enrollments.length > 0) {
      // One INSERT for the whole class instead of one round-trip per student.
      await createNotificationsForRecipients(
        "New assignment posted",
        message,
        "STUDENT",
        course.enrollments.map((enrollment) => enrollment.studentId),
      );
    } else {
      await createNotification("New assignment posted", message, "STUDENT");
    }

    return NextResponse.json(
      {
        id: assignment.id,
        title: assignment.title,
        course: assignment.course.title,
        courseId: assignment.course.id,
        dueDate: dueDateText,
        totalMarks: assignment.totalMarks,
        status: "Pending",
      },
      { status: 201 }
    );


  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

