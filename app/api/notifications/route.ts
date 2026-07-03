import { NextResponse } from "next/server";
import { createNotification, getNotifications } from "@/lib/auth";

const validAudiences = ["ALL", "STUDENT", "TEACHER", "ADMIN"] as const;

type ValidNotificationAudience = (typeof validAudiences)[number];

function isValidNotificationAudience(value: unknown): value is ValidNotificationAudience {
  return typeof value === "string" && validAudiences.includes(value as ValidNotificationAudience);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const role = url.searchParams.get("role") as "STUDENT" | "TEACHER" | "ADMIN" | null;
    const userId = url.searchParams.get("userId") || undefined;

    const notifications = await getNotifications(role || undefined, userId);
    if (!notifications || notifications.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const audience = isValidNotificationAudience(body.audience)
    ? body.audience
    : "ALL";
  // Support per-user notifications via `recipientId`
  if (body.recipientId) {
    const notification = await createNotification(body.title || "Notification", body.message || "You have a new update.", audience, body.recipientId);
    return NextResponse.json(notification, { status: 201 });
  }

  const notification = await createNotification(body.title || "Notification", body.message || "You have a new update.", audience);
  return NextResponse.json(notification, { status: 201 });
}
