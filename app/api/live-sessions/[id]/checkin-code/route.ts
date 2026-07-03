import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt, prisma } from "@/lib/auth";

function generateCode(): string {
  // Exclude ambiguous characters: 0, O, 1, I, L
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = verifyJwt(token);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const session = await prisma.liveSession.findUnique({
    where: { id },
    include: { course: { select: { teacherId: true } } },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.course.teacherId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.liveSession.update({
    where: { id },
    data: { checkInCode: code, checkInCodeExpiresAt: expiresAt },
  });

  return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = verifyJwt(token);
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const session = await prisma.liveSession.findUnique({
    where: { id },
    include: { course: { select: { teacherId: true } } },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.course.teacherId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !session.checkInCode ||
    !session.checkInCodeExpiresAt ||
    new Date(session.checkInCodeExpiresAt) < new Date()
  ) {
    return NextResponse.json({ code: null, expiresAt: null });
  }

  return NextResponse.json({
    code: session.checkInCode,
    expiresAt: session.checkInCodeExpiresAt.toISOString(),
  });
}
