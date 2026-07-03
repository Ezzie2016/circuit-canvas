import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
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

    if (decoded.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all live sessions for courses the student is enrolled in
    const liveSessions = await prisma.liveSession.findMany({
      where: {
        course: {
          enrollments: {
            some: {
              studentId: decoded.id,
            },
          },
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        startsAt: "desc",
      },
    });

    return NextResponse.json(liveSessions);
  } catch (error) {
    console.error("Error fetching live sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch live sessions" },
      { status: 500 }
    );
  }
}
