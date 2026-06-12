import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get("assignmentId");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let submissions;
    if (decoded.role === "STUDENT") {
      submissions = await prisma.submission.findMany({
        where: { studentId: decoded.id, assignmentId: assignmentId || undefined },
        include: {
          student: true,
          assignment: { include: { course: true } },
        },
      });
    } else if (decoded.role === "TEACHER") {
      submissions = await prisma.submission.findMany({
        where: {
          assignment: {
            courseId: assignmentId ? undefined : undefined,
            course: { teacherId: decoded.id },
          },
        },
        include: {
          student: true,
          assignment: { include: { course: true } },
        },
      });
    } else {
      submissions = await prisma.submission.findMany({
        where: { assignmentId: assignmentId || undefined },
        include: {
          student: true,
          assignment: { include: { course: true } },
        },
      });
    }

    const formatted = (submissions as any[]).map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student?.name || "",
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment?.title || "",
      courseName: s.assignment?.course?.title || "",
      assignmentDueDate: s.assignment?.dueDate?.toISOString().split("T")[0] || null,
      response: s.response,
      status: s.status,
      grade: s.grade,
      feedback: s.feedback,
      fileUrl: s.fileUrl,
      fileName: s.fileName,
      fileSize: s.fileSize,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
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
    if (!decoded || decoded.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can submit assignments" }, { status: 403 });
    }

    const formData = await request.formData();
    const assignmentId = formData.get("assignmentId") as string;
    const response = formData.get("response") as string;
    const file = formData.get("file") as File | null;

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: decoded.id,
        courseId: assignment.courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Check for existing submission
    let submission = await prisma.submission.findUnique({
      where: {
        studentId_assignmentId: {
          studentId: decoded.id,
          assignmentId,
        },
      },
    });

    // If a file was uploaded, save it to public/uploads and set file metadata
    let savedFileUrl: string | null = null;
    let savedFileName: string | null = null;
    let savedFileSize: number | null = null;
    let savedFileType: string | null = null;

    if (file) {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const filePath = path.join(uploadsDir, safeName);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);
        savedFileUrl = `/uploads/${safeName}`;
        savedFileName = file.name;
        savedFileSize = buffer.length;
        savedFileType = file.type || null;
      } catch (err) {
        console.error("Failed to save uploaded file:", err);
        return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
      }
    }

    if (submission) {
      submission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          response: response || submission.response,
          fileUrl: savedFileUrl || submission.fileUrl,
          fileName: savedFileName || submission.fileName,
          fileSize: savedFileSize || submission.fileSize,
          fileType: savedFileType || submission.fileType,
          status: "SUBMITTED",
        },
        include: {
          student: true,
          assignment: { include: { course: true } },
        },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          response: response || "",
          studentId: decoded.id,
          assignmentId,
          status: "SUBMITTED",
          fileUrl: savedFileUrl,
          fileName: savedFileName,
          fileSize: savedFileSize,
          fileType: savedFileType,
        },
        include: {
          student: true,
          assignment: { include: { course: true } },
        },
      });
    }

    return NextResponse.json(
      {
        id: submission.id,
        studentName: (submission as any).student?.name || "",
        assignmentTitle: (submission as any).assignment?.title || "",
        status: submission.status,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        createdAt: submission.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json({ error: "Failed to submit assignment" }, { status: 500 });
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
      return NextResponse.json({ error: "Only teachers can grade submissions" }, { status: 403 });
    }

    const body = await request.json();
    const submission = await prisma.submission.update({
      where: { id: body.id },
      data: {
        grade: body.grade || null,
        feedback: body.feedback || null,
        status: "REVIEWED",
      },
      include: {
        student: true,
        assignment: { include: { course: true } },
      },
    });

    return NextResponse.json({
      id: submission.id,
      studentName: (submission as any).student?.name,
      grade: submission.grade,
      feedback: submission.feedback,
      status: submission.status,
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 });
  }
}
