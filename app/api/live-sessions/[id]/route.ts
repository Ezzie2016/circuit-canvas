import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: params.id },
      include: {
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

    const durationMinutes = liveSession.endsAt
      ? Math.round((liveSession.endsAt.getTime() - liveSession.startsAt.getTime()) / (1000 * 60))
      : null;

    return NextResponse.json({
      id: liveSession.id,
      title: liveSession.title,
      startsAt: liveSession.startsAt.toISOString(),
      endsAt: liveSession.endsAt?.toISOString(),
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
