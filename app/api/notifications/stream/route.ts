import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJwt, getNotifications, getLatestNotificationId } from "@/lib/auth";

export const runtime = "nodejs";

const POLL_MS = 5000;
// Comment line keeps proxies/load balancers from closing an idle connection.
const HEARTBEAT_EVERY_N_POLLS = 3;

export async function GET(request: Request) {
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
  const encoder = new TextEncoder();

  let timer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stop = () => {
    closed = true;
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Controller already closed (client went away).
          stop();
        }
      };
      const push = (eventName: string, data: unknown) =>
        write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);

      let lastSentId: string | null = null;

      try {
        const initial = await getNotifications(role, userId);
        lastSentId = initial[0]?.id ?? null;
        push("notification", { type: "init", notifications: initial });
      } catch {
        push("notification", { type: "init", notifications: [] });
      }

      let polls = 0;
      // Chained setTimeout (not setInterval) so slow queries never overlap.
      const poll = async () => {
        if (closed) return;
        try {
          // Cheap check: one indexed row, id only. Only fetch the full list
          // when something actually changed.
          const newestId = await getLatestNotificationId(role, userId);
          if (newestId && newestId !== lastSentId) {
            const current = await getNotifications(role, userId);
            lastSentId = current[0]?.id ?? newestId;
            push("notification", { type: "delta", notifications: current });
          } else if (++polls % HEARTBEAT_EVERY_N_POLLS === 0) {
            write(": ping\n\n");
          }
        } catch {
          // Transient DB error — try again next tick.
        }
        if (!closed) timer = setTimeout(poll, POLL_MS);
      };
      timer = setTimeout(poll, POLL_MS);
    },
    cancel() {
      stop();
    },
  });

  // Client disconnects abort the request signal; stop polling immediately.
  request.signal.addEventListener("abort", stop, { once: true });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
