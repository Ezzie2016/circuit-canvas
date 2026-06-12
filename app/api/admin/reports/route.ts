import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
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

    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current and previous month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Enrollment Growth: Compare enrollments this month vs last month
    const currentMonthEnrollments = await prisma.enrollment.count({
      where: {
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    const previousMonthEnrollments = await prisma.enrollment.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    });

    const enrollmentGrowth =
      previousMonthEnrollments > 0
        ? Math.round(((currentMonthEnrollments - previousMonthEnrollments) / previousMonthEnrollments) * 100)
        : 0;

    // Completion Trends: Average completion rate across all courses
    const allSubmissions = await prisma.submission.findMany();
    const allAssignments = await prisma.assignment.findMany();
    const completedSubmissions = allSubmissions.filter((s) => s.status === "REVIEWED").length;
    const averageCompletion = allAssignments.length > 0
      ? Math.round((completedSubmissions / allAssignments.length) * 100)
      : 0;

    // User Activity: Live sessions by time of day (using actual attendance records)
    const liveSessionsWithAttendance = await prisma.liveSession.findMany({
      select: {
        id: true,
        startsAt: true,
        attendanceRecords: {
          where: { status: "PRESENT" },
          select: { id: true },
        },
      },
    });

    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    liveSessionsWithAttendance.forEach((session) => {
      const hour = new Date(session.startsAt).getHours();
      const presentCount = session.attendanceRecords.length;
      if (hour < 12) morningCount += presentCount;
      else if (hour < 17) afternoonCount += presentCount;
      else eveningCount += presentCount;
    });

    const totalSessionAttendance = morningCount + afternoonCount + eveningCount;
    let strongestBlock = "afternoon";
    if (morningCount > afternoonCount && morningCount > eveningCount) {
      strongestBlock = "morning";
    } else if (eveningCount > afternoonCount && eveningCount > morningCount) {
      strongestBlock = "evening";
    }

    // Get total active users and new signups
    const activeUsers = await prisma.user.count({
      where: { status: "ACTIVE" },
    });

    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();

    return NextResponse.json({
      enrollmentGrowth: {
        value: enrollmentGrowth,
        currentMonth: currentMonthEnrollments,
        previousMonth: previousMonthEnrollments,
      },
      completionTrends: {
        value: averageCompletion,
        totalAssignments: allAssignments.length,
        completedCount: completedSubmissions,
      },
      userActivity: {
        strongestBlock,
        morningAttendance: morningCount,
        afternoonAttendance: afternoonCount,
        eveningAttendance: eveningCount,
        totalSessionAttendance,
      },
      systemOverview: {
        activeUsers,
        totalCourses,
        totalEnrollments,
        totalAssignments: allAssignments.length,
        totalSubmissions: allSubmissions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
