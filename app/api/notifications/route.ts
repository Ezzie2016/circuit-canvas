import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createNotification, getNotifications, verifyJwt } from "@/lib/auth";

const validAudiences = ["ALL", "STUDENT", "TEACHER", "ADMIN"] as const;
type ValidNotificationAudience = (typeof validAudiences)[number];

function isValidNotificationAudience(value: unknown): value is ValidNotificationAudience {
  return typeof value === "string" && validAudiences.includes(value as ValidNotificationAudience);
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyJwt(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const url = new URL(request.url);
    const role = url.searchParams.get("role") as "STUDENT" | "TEACHER" | "ADMIN" | null;
    const userId = url.searchParams.get("userId") || undefined;

    // Non-admins can only fetch their own notifications
    if (decoded.role !== "ADMIN" && userId && userId !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const notifications = await getNotifications(role || undefined, userId);
    return NextResponse.json(notifications ?? []);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const audience = isValidNotificationAudience(body.audience) ? body.audience : "ALL";

    const notification = await createNotification(
      body.title || "Notification",
      body.message || "You have a new update.",
      audience,
      body.recipientId || undefined,
    );
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
