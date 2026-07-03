import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt, prisma } from "@/lib/auth";

// POST /api/assignments/[id]/direct-scores
// Teacher enters scores directly for a list of students (in-person assessments)
// Body: { scores: Array<{ studentId: string; earnedMarks: number | null }> }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = verifyJwt(token);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: { select: { teacherId: true } } },
  });

  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  if (assignment.course.teacherId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const scores: { studentId: string; earnedMarks: number | null }[] = body.scores ?? [];

  if (!Array.isArray(scores) || scores.length === 0) {
    return NextResponse.json({ error: "scores array is required" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    scores.map(async ({ studentId, earnedMarks }) => {
      if (
        earnedMarks !== null &&
        (!Number.isFinite(earnedMarks) || earnedMarks < 0 || earnedMarks > assignment.totalMarks)
      ) {
        throw new Error(`Invalid marks for student ${studentId}`);
      }

      return prisma.submission.upsert({
        where: { studentId_assignmentId: { studentId, assignmentId: id } },
        update: { earnedMarks, status: "REVIEWED" },
        create: {
          studentId,
          assignmentId: id,
          earnedMarks,
          status: "REVIEWED",
          response: "",
        },
      });
    })
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  return NextResponse.json({ saved: results.length - failed, failed });
}
