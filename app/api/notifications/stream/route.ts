import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJwt, getNotifications } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyJwt(token);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const role =
    decoded.role === "TEACHER"
      ? "TEACHER"
      : decoded.role === "ADMIN"
        ? "ADMIN"
        : "STUDENT";

  const userId = String(decoded.id);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const push = (eventName: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          // Ignore enqueue errors after client disconnects.
        }
      };

      let lastSentId: string | null = null;

      try {
        const initial = await getNotifications(role, userId);
        if (Array.isArray(initial) && initial.length > 0) {
          lastSentId = String(initial[0].id);
        }
        push("notification", { type: "init", notifications: initial || [] });
      } catch {
        push("notification", { type: "init", notifications: [] });
      }

      const POLL_MS = 3000;
      const interval = setInterval(async () => {
        try {
          const current = await getNotifications(role, userId);
          if (!Array.isArray(current) || current.length === 0) return;

          const newest = current[0];
          if (!newest) return;

          const newestId = String(newest.id);
          if (lastSentId !== newestId) {
            lastSentId = newestId;
            push("notification", { type: "delta", notifications: current });
          }
        } catch {
          // ignore
        }
      }, POLL_MS);

      // Best-effort cleanup
      // @ts-expect-error -- ReadableStreamDefaultController has no onclose in TS lib
      controller.onclose = () => clearInterval(interval);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

