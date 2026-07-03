import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt, prisma } from "@/lib/auth";

// Category weights (fixed scheme — total 100)
const CATEGORY_MAX: Record<string, number> = {
  ASSIGNMENT: 10,
  QUIZ: 10,
  MID_SEMESTER: 15,
  EXAM: 60,
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = verifyJwt(token);
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // All enrolled courses with their assignments and the student's submissions
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        include: {
          assignments: {
            include: {
              submissions: {
                where: { studentId: user.id },
                select: { earnedMarks: true, status: true },
              },
            },
          },
        },
      },
    },
  });

  // Attendance records grouped by courseId
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { studentId: user.id },
    select: { courseId: true, status: true },
  });

  const attendanceByCourse = new Map<string, { present: number; total: number }>();
  for (const rec of attendanceRecords) {
    const cur = attendanceByCourse.get(rec.courseId) ?? { present: 0, total: 0 };
    attendanceByCourse.set(rec.courseId, {
      present: cur.present + (rec.status === "PRESENT" ? 1 : 0),
      total: cur.total + 1,
    });
  }

  const courses = enrollments.map(({ course }) => {
    // Group assignments by type
    const byType: Record<
      string,
      { sumPct: number; total: number; graded: number; pending: number }
    > = {};

    for (const assignment of course.assignments) {
      const type = assignment.type as string;
      if (!byType[type]) byType[type] = { sumPct: 0, total: 0, graded: 0, pending: 0 };

      byType[type].total += 1;
      const sub = assignment.submissions[0];
      if (!sub) {
        // Not submitted — counts as 0
      } else if (sub.status === "REVIEWED" && sub.earnedMarks != null && assignment.totalMarks > 0) {
        byType[type].sumPct += sub.earnedMarks / assignment.totalMarks;
        byType[type].graded += 1;
      } else {
        byType[type].pending += 1;
        // Pending — provisionally 0 in calculation
      }
    }

    // Compute per-category scores
    const breakdown: Record<
      string,
      { score: number | null; max: number; graded: number; total: number; pending: number }
    > = {};
    let totalEarned = 0;
    let totalMax = 0;

    for (const [type, max] of Object.entries(CATEGORY_MAX)) {
      const data = byType[type];
      if (!data || data.total === 0) {
        breakdown[type] = { score: null, max, graded: 0, total: 0, pending: 0 };
      } else {
        // Average % across ALL assessments (unsubmitted = 0), scaled to category max
        const score = parseFloat(((data.sumPct / data.total) * max).toFixed(2));
        breakdown[type] = {
          score,
          max,
          graded: data.graded,
          total: data.total,
          pending: data.pending,
        };
        totalEarned += score;
        totalMax += max;
      }
    }

    // Attendance score (out of 5)
    const att = attendanceByCourse.get(course.id);
    const attRate = att && att.total > 0 ? att.present / att.total : null;
    const attScore = attRate != null ? parseFloat((attRate * 5).toFixed(2)) : null;
    if (attScore != null) {
      totalEarned += attScore;
      totalMax += 5;
    }

    const hasPending = Object.values(breakdown).some((b) => b.pending > 0);

    return {
      courseId: course.id,
      courseName: course.title,
      breakdown,
      attendance: {
        score: attScore,
        max: 5,
        rate: attRate != null ? Math.round(attRate * 100) : null,
        present: att?.present ?? 0,
        totalSessions: att?.total ?? 0,
      },
      total: {
        earned: parseFloat(totalEarned.toFixed(2)),
        max: totalMax > 0 ? 100 : 0,
        isProvisional: hasPending,
      },
    };
  });

  return NextResponse.json({ courses });
}
