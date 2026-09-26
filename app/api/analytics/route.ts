import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

async function teacherAnalytics(teacherId: string) {
  const now = new Date();
  const [courses, attendanceGroups, upcomingSessions] = await Promise.all([
    prisma.course.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        _count: { select: { enrollments: true } },
        assignments: {
          select: {
            dueDate: true,
            totalMarks: true,
            submissions: { select: { status: true, earnedMarks: true } },
          },
        },
      },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["courseId", "status"],
      where: { course: { teacherId } },
      _count: { _all: true },
    }),
    prisma.liveSession.count({
      where: { course: { teacherId }, startsAt: { gt: now } },
    }),
  ]);

  const attendanceByCourse = new Map<string, { total: number; present: number }>();
  for (const g of attendanceGroups) {
    const entry = attendanceByCourse.get(g.courseId) ?? { total: 0, present: 0 };
    entry.total += g._count._all;
    if (g.status === "PRESENT") entry.present += g._count._all;
    attendanceByCourse.set(g.courseId, entry);
  }

  let totalStudents = 0;
  let totalAssignments = 0;
  let pendingAssignments = 0;
  let submittedCount = 0;
  let reviewedCount = 0;

  const courseStats = courses.map((course) => {
    const courseStudents = course._count.enrollments;
    const assignmentCount = course.assignments.length;
    totalStudents += courseStudents;
    totalAssignments += assignmentCount;

    let courseSubmissionCount = 0;
    let gradeSum = 0;
    let gradeCount = 0;
    for (const assignment of course.assignments) {
      if (assignment.dueDate > now) pendingAssignments++;
      for (const s of assignment.submissions) {
        courseSubmissionCount++;
        if (s.status === "SUBMITTED") submittedCount++;
        if (s.status === "REVIEWED") {
          reviewedCount++;
          if (s.earnedMarks != null && assignment.totalMarks > 0) {
            gradeSum += (s.earnedMarks / assignment.totalMarks) * 100;
            gradeCount++;
          }
        }
      }
    }

    const attendance = attendanceByCourse.get(course.id) ?? { total: 0, present: 0 };

    return {
      courseId: course.id,
      courseName: course.title,
      totalStudents: courseStudents,
      averageGrade: gradeCount > 0 ? Math.round(gradeSum / gradeCount) : 0,
      submitRate:
        courseStudents > 0 && assignmentCount > 0
          ? Math.round((courseSubmissionCount / (courseStudents * assignmentCount)) * 100)
          : 0,
      attendanceRate: percent(attendance.present, attendance.total),
    };
  });

  return {
    totalCourses: courses.length,
    totalStudents,
    pendingAssignments,
    totalAssignments,
    submittedCount,
    reviewedCount,
    averageCompletion: percent(reviewedCount, totalAssignments),
    upcomingSessions,
    courseStats,
  };
}

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

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId");
    const studentId = url.searchParams.get("studentId");

    if (decoded.role === "ADMIN" && studentId) {
      // Admin viewing specific student's analytics
      const [enrollments, submissions, attendanceRecords] = await Promise.all([
        prisma.enrollment.findMany({
          where: { studentId },
          select: {
            course: {
              select: {
                id: true,
                title: true,
                teacher: { select: { name: true } },
                assignments: { select: { id: true } },
                attendance: { where: { studentId }, select: { status: true } },
              },
            },
          },
        }),
        prisma.submission.findMany({
          where: { studentId },
          select: {
            assignmentId: true,
            status: true,
            earnedMarks: true,
            assignment: { select: { totalMarks: true } },
          },
        }),
        prisma.attendanceRecord.findMany({ where: { studentId }, select: { status: true } }),
      ]);

      const totalAssignments = enrollments.reduce(
        (sum, e) => sum + e.course.assignments.length, 0
      );
      const submittedCount = submissions.length;
      const gradedSubs = submissions.filter(
        (s) => s.status === "REVIEWED" && s.earnedMarks != null && s.assignment.totalMarks > 0
      );
      const avgGrade = gradedSubs.length > 0
        ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.earnedMarks! / s.assignment.totalMarks) * 100, 0) / gradedSubs.length)
        : 0;
      const presentCount = attendanceRecords.filter((r) => r.status === "PRESENT").length;
      const attendanceRate = attendanceRecords.length > 0
        ? Math.round((presentCount / attendanceRecords.length) * 100)
        : 0;

      const courseStats = enrollments.map((e) => {
        const course = e.course;
        const assignmentIds = new Set(course.assignments.map((a) => a.id));
        const courseSubs = submissions.filter((s) => assignmentIds.has(s.assignmentId));
        const courseGraded = courseSubs.filter(
          (s) => s.status === "REVIEWED" && s.earnedMarks != null && s.assignment.totalMarks > 0
        );
        const courseGrade = courseGraded.length > 0
          ? Math.round(courseGraded.reduce((sum, s) => sum + (s.earnedMarks! / s.assignment.totalMarks) * 100, 0) / courseGraded.length)
          : null;
        const courseAttendance = course.attendance;
        const courseAttRate = courseAttendance.length > 0
          ? Math.round((courseAttendance.filter((a) => a.status === "PRESENT").length / courseAttendance.length) * 100)
          : 0;
        return {
          courseId: course.id,
          courseName: course.title,
          teacherName: course.teacher.name,
          totalAssignments: course.assignments.length,
          submitted: courseSubs.length,
          avgGrade: courseGrade,
          attendanceRate: courseAttRate,
        };
      });

      return NextResponse.json({
        enrolledCourses: enrollments.length,
        totalAssignments,
        submittedCount,
        pendingAssignments: totalAssignments - submittedCount,
        avgGrade,
        attendanceRate,
        courseStats,
      });
    } else if (decoded.role === "ADMIN" && teacherId) {
      // Admin viewing specific teacher's analytics
      return NextResponse.json(await teacherAnalytics(teacherId));
    } else if (decoded.role === "ADMIN") {
      // Admin analytics — counts only; never load whole tables into memory.
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      const tomorrowStart = new Date(new Date().setHours(24, 0, 0, 0));
      const [
        totalUsers,
        activeUsers,
        totalCourses,
        totalSubmissions,
        todayUsers,
        totalAssignments,
        totalAttendance,
        presentAttendance,
        liveSessionsToday,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.course.count(),
        prisma.submission.count(),
        prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.assignment.count(),
        prisma.attendanceRecord.count(),
        prisma.attendanceRecord.count({ where: { status: "PRESENT" } }),
        prisma.liveSession.count({ where: { startsAt: { gte: todayStart, lt: tomorrowStart } } }),
      ]);

      return NextResponse.json({
        activeUsers,
        totalUsers,
        coursesPublished: totalCourses,
        // Every submission is SUBMITTED or REVIEWED, so completed == all submissions.
        averageCompletion: percent(totalSubmissions, totalAssignments),
        liveSessionsToday,
        newRegistrations: todayUsers,
        averageAttendance: percent(presentAttendance, totalAttendance),
        totalSubmissions,
      });
    } else if (decoded.role === "TEACHER") {
      // Teacher analytics
      return NextResponse.json(await teacherAnalytics(decoded.id));
    } else if (decoded.role === "STUDENT") {
      // Student analytics
      const studentCourseFilter = { course: { enrollments: { some: { studentId: decoded.id } } } };
      const [enrolledCourses, totalAssignments, pendingAssignments, submittedAssignments, attendanceRecords, presentDays] =
        await Promise.all([
          prisma.enrollment.count({ where: { studentId: decoded.id } }),
          prisma.assignment.count({ where: studentCourseFilter }),
          prisma.assignment.count({ where: { ...studentCourseFilter, dueDate: { gt: new Date() } } }),
          prisma.submission.count({ where: { studentId: decoded.id } }),
          prisma.attendanceRecord.count({ where: { studentId: decoded.id } }),
          prisma.attendanceRecord.count({ where: { studentId: decoded.id, status: "PRESENT" } }),
        ]);

      return NextResponse.json({
        enrolledCourses,
        pendingAssignments,
        submittedAssignments,
        totalAssignments,
        averageCompletion: percent(submittedAssignments, totalAssignments),
        attendanceRate: percent(presentDays, attendanceRecords),
      });
    }

    return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
