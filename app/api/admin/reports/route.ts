import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers, activeUsers,
      totalStudents, totalTeachers,
      totalCourses,
      totalEnrollments,
      enrollmentsThisMonth, enrollmentsLastMonth,
      totalAssignments,
      allSubmissions,
      newUsersThisMonth, newUsersLastMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.enrollment.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.assignment.count(),
      prisma.submission.findMany({ select: { status: true, earnedMarks: true, assignment: { select: { totalMarks: true } } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ]);

    const submittedCount = allSubmissions.filter((s) => s.status === "SUBMITTED").length;
    const gradedCount    = allSubmissions.filter((s) => s.status === "REVIEWED").length;
    const pendingCount   = totalAssignments - allSubmissions.length;

    const gradedWithMarks = allSubmissions.filter(
      (s) => s.status === "REVIEWED" && s.earnedMarks != null && s.assignment.totalMarks > 0
    );
    const avgGrade = gradedWithMarks.length > 0
      ? Math.round(gradedWithMarks.reduce((sum, s) => sum + (s.earnedMarks! / s.assignment.totalMarks) * 100, 0) / gradedWithMarks.length)
      : null;

    // enrollment growth: null if no baseline, otherwise percentage
    let enrollmentGrowthPct: number | null = null;
    if (enrollmentsLastMonth > 0) {
      enrollmentGrowthPct = Math.round(((enrollmentsThisMonth - enrollmentsLastMonth) / enrollmentsLastMonth) * 100);
    }

    let registrationGrowthPct: number | null = null;
    if (newUsersLastMonth > 0) {
      registrationGrowthPct = Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100);
    }

    return NextResponse.json({
      school: { totalUsers, activeUsers, totalStudents, totalTeachers, totalCourses, totalEnrollments },
      academic: { totalAssignments, submittedCount, gradedCount, pendingCount, avgGrade },
      enrollments: { thisMonth: enrollmentsThisMonth, lastMonth: enrollmentsLastMonth, growthPct: enrollmentGrowthPct },
      registrations: { thisMonth: newUsersThisMonth, lastMonth: newUsersLastMonth, growthPct: registrationGrowthPct },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
