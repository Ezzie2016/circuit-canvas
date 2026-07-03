import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, verifyJwt } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can view students" }, { status: 403 });
    }

    // Find all enrollments for courses taught by this teacher
    const courses = await prisma.course.findMany({
      where: { teacherId: decoded.id },
      include: { enrollments: { include: { student: true } } },
    });

    const studentsMap: Record<string, { id: string; name: string; email: string }> = {};
    courses.forEach((course) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (course.enrollments || []).forEach((e: any) => {
        const s = e.student || { id: e.studentId };
        if (s && s.id) studentsMap[String(s.id)] = { id: s.id, name: s.name || "", email: s.email || "" };
      });
    });

    const students = Object.values(studentsMap);
    return NextResponse.json(students);
  } catch (err) {
    console.error("Failed to load teacher students:", err);
    return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
  }
}
