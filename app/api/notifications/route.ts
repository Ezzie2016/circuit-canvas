import { NextResponse } from "next/server";
import { createNotification, getNotifications } from "@/lib/auth";

const validAudiences = ["ALL", "STUDENT", "TEACHER", "ADMIN"] as const;

type ValidNotificationAudience = (typeof validAudiences)[number];

function isValidNotificationAudience(value: unknown): value is ValidNotificationAudience {
  return typeof value === "string" && validAudiences.includes(value as ValidNotificationAudience);
}

const sampleNotifications = [
  {
    id: "1",
    title: "Assignment graded",
    message: "Your Web Development assignment received an 88%.",
    audience: "STUDENT",
    createdAt: "2026-06-09T08:30:00Z",
  },
  {
    id: "2",
    title: "New live class",
    message: "Your live session for Advanced JavaScript starts in 30 minutes.",
    audience: "TEACHER",
    createdAt: "2026-06-09T09:00:00Z",
  },
  {
    id: "3",
    title: "Course published",
    message: "A new Data Structures course is available in your dashboard.",
    audience: "ALL",
    createdAt: "2026-06-08T14:15:00Z",
  },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const role = url.searchParams.get("role") as "STUDENT" | "TEACHER" | "ADMIN" | null;
    const userId = url.searchParams.get("userId") || undefined;

    const notifications = await getNotifications(role || undefined, userId);
    if (!notifications || notifications.length === 0) {
      const filtered = sampleNotifications.filter((notification) => notification.audience === "ALL" || notification.audience === role);
      return NextResponse.json(filtered);
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
