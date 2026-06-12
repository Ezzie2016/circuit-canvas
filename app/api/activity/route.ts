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
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can view activity" }, { status: 403 });
    }

    // Get recent activities from various models
    const [recentUsers, recentCourses, recentSubmissions] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.course.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { teacher: { select: { name: true } } },
      }),
      prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          student: { select: { name: true } },
          assignment: { select: { title: true } },
        },
      }),
    ]);

    const activities: any[] = [];

    // Add user activities
    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: "USER_CREATED",
        description: `User ${user.name} registered as ${user.role}`,
        user: user.name,
        timestamp: user.createdAt.toISOString(),
        severity: "info",
      });
    });

    // Add course activities
    recentCourses.forEach((course) => {
      activities.push({
        id: `course-${course.id}`,
        type: "COURSE_CREATED",
        description: `Course "${course.title}" created by ${course.teacher.name}`,
        user: course.teacher.name,
        timestamp: course.createdAt.toISOString(),
        severity: "info",
      });
    });

    // Add submission activities
    recentSubmissions.forEach((submission) => {
      activities.push({
        id: `submission-${submission.id}`,
        type: submission.status === "REVIEWED" ? "SUBMISSION_GRADED" : "SUBMISSION_CREATED",
        description: `${submission.student.name} ${
          submission.status === "REVIEWED" ? "submitted" : "submitted"
        } assignment "${submission.assignment.title}"${
          submission.grade ? ` with grade ${submission.grade}` : ""
        }`,
        user: submission.student.name,
        timestamp: submission.createdAt.toISOString(),
        severity: submission.status === "REVIEWED" ? "success" : "info",
      });
    });

    // Sort by timestamp and return top 30
    const sorted = activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(sorted.slice(0, 30));
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
