import { NextResponse } from "next/server";
import { prisma, verifyJwt, createNotification } from "@/lib/auth";
import { sendGradeNotificationEmail } from "@/lib/emailService";
import { uploadSubmissionFile } from "@/lib/supabase-storage";

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

    const where =
      decoded.role === "STUDENT"
        ? { studentId: decoded.id, assignmentId: assignmentId || undefined }
        : decoded.role === "TEACHER"
          ? {
              assignment: {
                ...(assignmentId ? { id: assignmentId } : {}),
                course: { teacherId: decoded.id },
              },
            }
          : { assignmentId: assignmentId || undefined };

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        student: { select: { name: true } },
        assignment: {
          select: {
            title: true,
            type: true,
            dueDate: true,
            totalMarks: true,
            course: { select: { title: true } },
          },
        },
      },
    });

    const formatted = submissions.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student?.name || "",
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment?.title || "",
      assignmentType: s.assignment?.type || "ASSIGNMENT",
      courseName: s.assignment?.course?.title || "",
      assignmentDueDate: s.assignment?.dueDate?.toISOString().split("T")[0] || null,
      response: s.response,
      status: s.status,
      earnedMarks: s.earnedMarks,
      totalMarks: s.assignment?.totalMarks ?? null,
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
    const assignmentIdRaw = formData.get("assignmentId") as string;
    const assignmentId = String(assignmentIdRaw);

    const response = formData.get("response") as string;
    const file = formData.get("file") as File | null;

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    // Prisma id for Assignment is a String (cuid). However, the frontend sometimes passes numeric-like ids.
    // First try direct lookup, then fall back to numeric-like conversions.
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { title: true, courseId: true, course: { select: { teacherId: true } } },
    });

    if (!assignment) {
      // assignmentId coming from the UI might be a DB id (string cuid) OR a numeric placeholder.
      // When it doesn't match, fall back by returning 404 with a clear message.
      return NextResponse.json(
        {
          error: "Assignment not found",
          assignmentId,
        },
        { status: 404 }
      );
    }

    // Check if student is enrolled in the course

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: decoded.id,
          courseId: assignment.courseId,
        },
      },
      select: { id: true },
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
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          // Use Supabase Storage (works on Vercel)
          const uploaded = await uploadSubmissionFile(file, decoded.id, assignmentId);
          savedFileUrl = uploaded.url;
          savedFileName = uploaded.name;
          savedFileSize = uploaded.size;
          savedFileType = file.type || null;
        } else {
          // Local fallback for development
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
        }
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
      });
    }

    // Real-time notification: notify the teacher of this assignment's course.
    try {
      const teacherId = assignment.course?.teacherId;

      if (teacherId) {
        await createNotification(
          "New assignment submitted",
          `A student submitted: ${assignment.title}`,
          "TEACHER",
          teacherId
        );
      }
    } catch (e) {
      console.error("Failed to create submission notification", e);
    }

    return NextResponse.json(

      {
        id: submission.id,
        studentName: decoded.name || "",
        assignmentTitle: assignment.title,
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

    // ---- Harden inputs (prevents NaN/undefined causing Prisma errors) ----
    if (!body?.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Submission id (string) is required" }, { status: 400 });
    }

    const earnedMarksProvided = body.earnedMarks;
    // Frontend should send a number, but handle stringy/empty inputs safely.
    let earnedMarksNum: number | null = null;
    if (earnedMarksProvided === null || earnedMarksProvided === undefined || earnedMarksProvided === "") {
      earnedMarksNum = null;
    } else {
      earnedMarksNum = typeof earnedMarksProvided === "number" ? earnedMarksProvided : Number(earnedMarksProvided);
      if (!Number.isFinite(earnedMarksNum)) {
        return NextResponse.json({ error: "earnedMarks must be a finite number" }, { status: 400 });
      }
    }

    const existing = await prisma.submission.findUnique({
      where: { id: body.id },
      select: { assignment: { select: { totalMarks: true, course: { select: { teacherId: true } } } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (existing.assignment.course.teacherId !== decoded.id) {
      return NextResponse.json({ error: "You can only grade submissions for your own courses" }, { status: 403 });
    }

    const totalMarks: number | null = existing.assignment.totalMarks ?? null;

    if (totalMarks !== null) {
      if (earnedMarksNum === null) {
        return NextResponse.json({ error: "earnedMarks is required for this assignment" }, { status: 400 });
      }
      if (earnedMarksNum < 0 || earnedMarksNum > totalMarks) {
        return NextResponse.json(
          { error: `earnedMarks must be between 0 and ${totalMarks}` },
          { status: 400 }
        );
      }
    }

    const feedback = typeof body.feedback === "string" && body.feedback.trim().length > 0 ? body.feedback : null;

    const submission = await prisma.submission.update({
      where: { id: body.id },
      data: {
        earnedMarks: totalMarks !== null ? earnedMarksNum : null,
        feedback,
        status: "REVIEWED",
      },
      include: {
        student: { select: { name: true, email: true } },
        assignment: { select: { title: true, totalMarks: true, course: { select: { title: true } } } },
      },
    });


    const studentEmail = submission.student.email;
    const studentName = submission.student.name || "Student";
    const assignmentTitle = submission.assignment.title || "";
    const courseName = submission.assignment.course.title || "";
    const marks =
      submission.earnedMarks != null ? ` — ${submission.earnedMarks}/${submission.assignment.totalMarks}` : "";

    // In-app notifications for the student and admins, written in parallel.
    const notifyResults = await Promise.allSettled([
      createNotification(
        "Assignment graded",
        `Your submission for "${assignmentTitle || "an assignment"}" has been graded${marks}.`,
        "STUDENT",
        submission.studentId,
      ),
      createNotification(
        "Assignment graded",
        `${submission.student.name || "A student"} was graded on "${assignmentTitle || "an assignment"}"${marks}.`,
        "ADMIN",
      ),
    ]);
    for (const r of notifyResults) {
      if (r.status === "rejected") console.error("Failed to create grade notification", r.reason);
    }

    // Email the student their grade (non-blocking)
    if (studentEmail) {
      sendGradeNotificationEmail(
        studentEmail,
        studentName,
        assignmentTitle,
        courseName,
        submission.earnedMarks ?? null,
        submission.assignment.totalMarks ?? null,
        submission.feedback ?? null,
      ).catch((e) => console.error("Grade email error:", e));
    }

    return NextResponse.json({
      id: submission.id,
      studentName,
      earnedMarks: submission.earnedMarks,
      feedback: submission.feedback,
      status: submission.status,
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 });
  }
}
