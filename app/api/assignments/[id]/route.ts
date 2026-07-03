import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

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
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Check authorization
    if (decoded.role === "TEACHER" && assignment.course.teacherId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all enrolled students
    const enrolledStudents = await prisma.enrollment.findMany({
      where: { courseId: assignment.courseId },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    const submissionMap = new Map(
      assignment.submissions.map((s) => [s.studentId, s])
    );

    const studentSubmissionStatus = enrolledStudents.map((e) => {
      const submission = submissionMap.get(e.studentId);
      const isLate = submission && assignment.dueDate
        ? submission.createdAt > assignment.dueDate
        : false;
      return {
        studentId: e.student.id,
        studentName: e.student.name,
        studentEmail: e.student.email,
        submitted: !!submission,
        submissionId: submission?.id,
        status: submission?.status || "NOT_SUBMITTED",
        earnedMarks: submission?.earnedMarks ?? null,
        feedback: submission?.feedback ?? null,
        response: submission?.response ?? null,
        fileUrl: submission?.fileUrl ?? null,
        fileName: submission?.fileName ?? null,
        submittedAt: submission?.createdAt?.toISOString() ?? null,
        isLate,
      };
    });

    return NextResponse.json({
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate.toISOString(),
      totalMarks: assignment.totalMarks,
      courseName: assignment.course.title,
      courseId: assignment.courseId,
      totalStudents: enrolledStudents.length,
      submittedCount: assignment.submissions.length,
      notSubmittedCount: enrolledStudents.length - assignment.submissions.length,
      submissions: studentSubmissionStatus,
    });
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment details" },
      { status: 500 }
    );
  }
}
