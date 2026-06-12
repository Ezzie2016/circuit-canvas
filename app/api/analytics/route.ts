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

    // Check if admin is requesting teacher-specific analytics
    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId");

    if (decoded.role === "ADMIN" && teacherId) {
      // Admin viewing specific teacher's analytics
      const courses = await prisma.course.findMany({
        where: { teacherId },
        include: {
          enrollments: true,
          assignments: {
            include: {
              submissions: true,
            },
          },
          attendance: true,
        },
      });

      const totalCourses = courses.length;
      const totalStudents = courses.reduce((sum, course) => sum + course.enrollments.length, 0);
      const assignments = courses.flatMap((course) => course.assignments);
      const submissions = assignments.flatMap((assignment) => assignment.submissions);
      const completedSubmissions = submissions.filter((s) => s.status === "REVIEWED").length;
      const averageCompletion = assignments.length > 0
        ? Math.round((completedSubmissions / assignments.length) * 100)
        : 0;

      const courseStats = courses.map((course) => {
        const totalStudents = course.enrollments.length;
        const assignmentCount = course.assignments.length;
        const courseSubmissions = course.assignments.flatMap((assignment) => assignment.submissions);
        const gradedValues = courseSubmissions
          .filter((submission) => submission.grade)
          .map((submission) => Number(String(submission.grade).replace("%", "")))
          .filter((value) => !Number.isNaN(value));

        const averageGrade = gradedValues.length > 0
          ? Math.round(gradedValues.reduce((sum, grade) => sum + grade, 0) / gradedValues.length)
          : 0;

        const submittedCount = courseSubmissions.filter((s) => s.status === "SUBMITTED" || s.status === "REVIEWED").length;
        const submitRate = totalStudents > 0 && assignmentCount > 0
          ? Math.round((submittedCount / (totalStudents * assignmentCount)) * 100)
          : 0;

        const attendanceTotal = course.attendance.length;
        const attendancePresent = course.attendance.filter((record) => record.status === "PRESENT").length;
        const attendanceRate = attendanceTotal > 0
          ? Math.round((attendancePresent / attendanceTotal) * 100)
          : 0;

        return {
          courseId: course.id,
          courseName: course.title,
          totalStudents,
          averageGrade,
          submitRate,
          attendanceRate,
        };
      });

      return NextResponse.json({
        totalCourses,
        totalStudents,
        pendingAssignments: assignments.filter((a) => new Date(a.dueDate) > new Date()).length,
        totalAssignments: assignments.length,
        submittedCount: submissions.filter((s) => s.status === "SUBMITTED").length,
        reviewedCount: completedSubmissions,
        averageCompletion,
        upcomingSessions: await prisma.liveSession.count({
          where: {
            course: { teacherId },
            startsAt: { gt: new Date() },
          },
        }),
        courseStats,
      });
    } else if (decoded.role === "ADMIN") {
      // Admin analytics
      const [totalUsers, activeUsers, totalCourses, totalSubmissions, todayUsers, allAssignments, allSubmissions, allAttendance] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.course.count(),
        prisma.submission.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.assignment.findMany(),
        prisma.submission.findMany(),
        prisma.attendanceRecord.findMany(),
      ]);

      // Calculate real average completion: submitted/reviewed submissions vs total assignments
      const completedCount = allSubmissions.filter((s) => s.status === "SUBMITTED" || s.status === "REVIEWED").length;
      const averageCompletion = allAssignments.length > 0
        ? Math.round((completedCount / allAssignments.length) * 100)
        : 0;

      // Calculate real average attendance
      const attendancePresent = allAttendance.filter((record) => record.status === "PRESENT").length;
      const averageAttendance = allAttendance.length > 0
        ? Math.round((attendancePresent / allAttendance.length) * 100)
        : 0;

      return NextResponse.json({
        activeUsers,
        totalUsers,
        coursesPublished: totalCourses,
        averageCompletion,
        liveSessionsToday: await prisma.liveSession.count({
          where: {
            startsAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(24, 0, 0, 0)),
            },
          },
        }),
        newRegistrations: todayUsers,
        averageAttendance,
        totalSubmissions,
      });
    } else if (decoded.role === "TEACHER") {
      // Teacher analytics
      const courses = await prisma.course.findMany({
        where: { teacherId: decoded.id },
        include: {
          enrollments: true,
          assignments: {
            include: {
              submissions: true,
            },
          },
          attendance: true,
        },
      });

      const totalCourses = courses.length;
      const totalStudents = courses.reduce((sum, course) => sum + course.enrollments.length, 0);
      const assignments = courses.flatMap((course) => course.assignments);
      const submissions = assignments.flatMap((assignment) => assignment.submissions);
      const completedSubmissions = submissions.filter((s) => s.status === "REVIEWED").length;
      const averageCompletion = assignments.length > 0
        ? Math.round((completedSubmissions / assignments.length) * 100)
        : 0;

      const courseStats = courses.map((course) => {
        const totalStudents = course.enrollments.length;
        const assignmentCount = course.assignments.length;
        const courseSubmissions = course.assignments.flatMap((assignment) => assignment.submissions);
        const gradedValues = courseSubmissions
          .filter((submission) => submission.grade)
          .map((submission) => Number(String(submission.grade).replace("%", "")))
          .filter((value) => !Number.isNaN(value));

        const averageGrade = gradedValues.length > 0
          ? Math.round(gradedValues.reduce((sum, grade) => sum + grade, 0) / gradedValues.length)
          : 0;

        const submittedCount = courseSubmissions.filter((s) => s.status === "SUBMITTED" || s.status === "REVIEWED").length;
        const submitRate = totalStudents > 0 && assignmentCount > 0
          ? Math.round((submittedCount / (totalStudents * assignmentCount)) * 100)
          : 0;

        const attendanceTotal = course.attendance.length;
        const attendancePresent = course.attendance.filter((record) => record.status === "PRESENT").length;
        const attendanceRate = attendanceTotal > 0
          ? Math.round((attendancePresent / attendanceTotal) * 100)
          : 0;

        return {
          courseId: course.id,
          courseName: course.title,
          totalStudents,
          averageGrade,
          submitRate,
          attendanceRate,
        };
      });

      return NextResponse.json({
        totalCourses,
        totalStudents: courses.reduce((sum, course) => sum + course.enrollments.length, 0),
        pendingAssignments: assignments.filter((a) => new Date(a.dueDate) > new Date()).length,
        totalAssignments: assignments.length,
        submittedCount: submissions.filter((s) => s.status === "SUBMITTED").length,
        reviewedCount: completedSubmissions,
        averageCompletion,
        upcomingSessions: await prisma.liveSession.count({
          where: {
            course: { teacherId: decoded.id },
            startsAt: { gt: new Date() },
          },
        }),
        courseStats,
      });
    } else if (decoded.role === "STUDENT") {
      // Student analytics
      const [enrolledCourses, assignments, submissions] = await Promise.all([
        prisma.enrollment.findMany({
          where: { studentId: decoded.id },
        }),
        prisma.assignment.findMany({
          where: {
            course: {
              enrollments: { some: { studentId: decoded.id } },
            },
          },
        }),
        prisma.submission.findMany({
          where: { studentId: decoded.id },
        }),
      ]);

      const completedSubmissions = submissions.length;
      const attendanceRecords = await prisma.attendanceRecord.count({
        where: { studentId: decoded.id },
      });
      const presentDays = await prisma.attendanceRecord.count({
        where: { studentId: decoded.id, status: "PRESENT" },
      });

      return NextResponse.json({
        enrolledCourses: enrolledCourses.length,
        pendingAssignments: assignments.filter((a) => new Date(a.dueDate) > new Date()).length,
        submittedAssignments: completedSubmissions,
        totalAssignments: assignments.length,
        averageCompletion: assignments.length > 0
          ? Math.round((completedSubmissions / assignments.length) * 100)
          : 0,
        attendanceRate: attendanceRecords > 0
          ? Math.round((presentDays / attendanceRecords) * 100)
          : 0,
      });
    }

    return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
