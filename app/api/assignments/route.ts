import { NextResponse } from "next/server";
import { prisma, verifyJwt, createNotification } from "@/lib/auth";
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

    let assignments;
    if (decoded.role === "STUDENT") {
      assignments = await prisma.assignment.findMany({
        where: {
          course: {
            enrollments: {
              some: { studentId: decoded.id },
            },
          },
        },
        include: {
          course: true,
          submissions: {
            where: { studentId: decoded.id },
          },
        },
      });
    } else if (decoded.role === "TEACHER") {
      assignments = await prisma.assignment.findMany({
        where: {
          course: { teacherId: decoded.id },
        },
        include: {
          course: true,
          submissions: true,
        },
      });
    } else {
      assignments = await prisma.assignment.findMany({
        include: {
          course: true,
          submissions: true,
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = assignments.map((a: any) => ({
      id: a.id,
      title: a.title,
      course: a.course.title,
      courseId: a.course.id,
      dueDate: a.dueDate.toISOString().split("T")[0],
      status: a.submissions && a.submissions.length > 0 ? "Submitted" : "Pending",
      instructions: a.instructions,
      totalMarks: a.totalMarks,
      type: a.type,
      submissionCount: a.submissions?.length || 0,
    }));



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
      include: { enrollments: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
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
        course: true,
      },
    });


    const dueDateText = assignment.dueDate.toISOString().split("T")[0];
    const message = `New assignment posted for ${assignment.course.title}: ${assignment.title} is due ${dueDateText}.`;

    if (course.enrollments.length > 0) {
      await Promise.all(
        course.enrollments.map((enrollment) =>
          createNotification("New assignment posted", message, "STUDENT", enrollment.studentId)
        )
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalMarks: (assignment as any).totalMarks,
        status: "Pending",
      },
      { status: 201 }
    );


  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

