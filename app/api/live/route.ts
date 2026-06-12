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

    let sessions;
    if (decoded.role === "STUDENT") {
      sessions = await prisma.liveSession.findMany({
        where: {
          course: {
            enrollments: {
              some: { studentId: decoded.id },
            },
          },
        },
        include: { course: true },
      });
    } else if (decoded.role === "TEACHER") {
      sessions = await prisma.liveSession.findMany({
        where: { course: { teacherId: decoded.id } },
        include: { course: true },
      });
    } else {
      sessions = await prisma.liveSession.findMany({
        include: { course: true },
      });
    }

    const formatted = sessions.map((s) => {
      const durationMinutes = s.endsAt
        ? Math.round((s.endsAt.getTime() - s.startsAt.getTime()) / (1000 * 60))
        : null;
      // Return appropriate link based on user role
      const displayLink = decoded.role === "TEACHER" && s.hostLink ? s.hostLink : s.link;
      return {
        id: s.id,
        title: s.title,
        course: s.course.title,
        courseId: s.courseId,
        start: s.startsAt.toISOString(),
        end: s.endsAt?.toISOString(),
        durationMinutes,
        link: displayLink,
        joinUrl: displayLink,
        hostLink: s.hostLink,
        participantLink: s.link,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching live sessions:", error);
    return NextResponse.json({ error: "Failed to fetch live sessions" }, { status: 500 });
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
    if (!decoded || decoded.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can create live sessions" }, { status: 403 });
    }

    const body = await request.json();
    const session = await prisma.liveSession.create({
      data: {
        title: body.title,
        link: body.link || body.joinUrl || body.participantLink,
        hostLink: body.hostLink || null,
        startsAt: new Date(body.start),
        endsAt: body.end ? new Date(body.end) : null,
        courseId: body.courseId,
      },
      include: { course: true },
    });

    const durationMinutes = session.endsAt
      ? Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / (1000 * 60))
      : null;

    return NextResponse.json(
      {
        id: session.id,
        title: session.title,
        course: session.course.title,
        start: session.startsAt.toISOString(),
        end: session.endsAt?.toISOString(),
        durationMinutes,
        link: session.link,
        hostLink: session.hostLink,
        participantLink: session.link,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating live session:", error);
    return NextResponse.json({ error: "Failed to create live session" }, { status: 500 });
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
      return NextResponse.json({ error: "Only teachers can update live sessions" }, { status: 403 });
    }

    const body = await request.json();
    const session = await prisma.liveSession.update({
      where: { id: body.id },
      data: {
        link: body.link,
      },
      include: { course: true },
    });

    return NextResponse.json({
      id: session.id,
      title: session.title,
      link: session.link,
    });
  } catch (error) {
    console.error("Error updating live session:", error);
    return NextResponse.json({ error: "Failed to update live session" }, { status: 500 });
  }
}
