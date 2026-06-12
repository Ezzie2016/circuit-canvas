import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        link: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: "Live session not found" },
        { status: 404 }
      );
    }

    const startsAtMs = new Date(liveSession.startsAt).getTime();
    const endsAtMs = liveSession.endsAt
      ? new Date(liveSession.endsAt).getTime()
      : null;

    const durationMinutes = endsAtMs
      ? Math.round((endsAtMs - startsAtMs) / (1000 * 60))
      : null;

    return NextResponse.json({
      id: liveSession.id,
      title: liveSession.title,
      startsAt: new Date(liveSession.startsAt).toISOString(),
      endsAt: liveSession.endsAt
        ? new Date(liveSession.endsAt).toISOString()
        : null,
      durationMinutes,
      link: liveSession.link,
      course: liveSession.course,
    });
  } catch (error) {
    console.error("Error fetching live session:", error);
    return NextResponse.json(
      { error: "Failed to fetch live session" },
      { status: 500 }
    );
  }
}

