import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, verifyJwt } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ departmentId: string }> },
) {
  try {
    const params = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete departments" }, { status: 403 });
    }

    await prisma.course.updateMany({
      where: { departmentId: params.departmentId },
      data: { departmentId: null },
    });

    await prisma.department.delete({ where: { id: params.departmentId } });
    return NextResponse.json({ message: "Department deleted" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
