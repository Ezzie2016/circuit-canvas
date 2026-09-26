import { PrismaClient } from "@prisma/client";
import type { Notification, Role as UserRole, NotificationAudience, User } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const DEV_JWT_SECRET = "your-secret-key-change-in-production";

// Read lazily (not at import) so `next build` works without the variable.
// In production a missing secret is a hard error: falling back to the public
// dev string would let anyone sign their own admin token.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return DEV_JWT_SECRET;
}

export type SessionPayload = {
  id: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  name?: string;
};

const SESSION_ROLES = new Set(["STUDENT", "TEACHER", "ADMIN"]);

// Verifies a login session token. Password-reset and invite tokens are signed
// with the same secret, so anything carrying a `type` claim, or lacking a
// user id and a real role, is rejected — otherwise a teacher invite link
// (role: "TEACHER") would work as a teacher login.
export function verifyJwt(token: string): SessionPayload | null {
  // Outside the try: a missing secret must surface as an error, not as
  // every user silently appearing logged out.
  const secret = getJwtSecret();
  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload !== "object" ||
      payload === null ||
      "type" in payload ||
      typeof payload.id !== "string" ||
      !payload.id ||
      typeof payload.role !== "string" ||
      !SESSION_ROLES.has(payload.role)
    ) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// Lazily constructed so that importing this module (e.g. during Next.js's
// build-time route analysis) never requires DATABASE_URL to be set — only
// actually using the client at runtime does.
// Cached on globalThis so dev-mode hot reloads reuse one client/pool instead
// of opening a new connection pool on every module re-evaluation.
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  let client = globalForPrisma.__prisma;
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);
    client = new PrismaClient({ adapter });
    globalForPrisma.__prisma = client;
  }
  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "STUDENT" | "TEACHER" | "ADMIN",
  matricNumber?: string,
): Promise<User> {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status: "ACTIVE",
        ...(matricNumber ? { matricNumber } : {}),
      },
    });

    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export type SafeUser = Pick<User, "id" | "name" | "email" | "role" | "status" | "matricNumber">;

export async function getUsers(role?: UserRole): Promise<SafeUser[]> {
  return prisma.user.findMany({
    where: role ? { role } : undefined,
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, status: true, matricNumber: true },
  });
}

const notificationAudiences = {
  ALL: "ALL",
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
} as const;

type NotificationAudienceString = (typeof notificationAudiences)[keyof typeof notificationAudiences];

const roleToAudienceMap: Record<UserRole, NotificationAudienceString> = {
  STUDENT: notificationAudiences.STUDENT,
  TEACHER: notificationAudiences.TEACHER,
  ADMIN: notificationAudiences.ADMIN,
};

export async function createNotification(
  title: string,
  message: string,
  audience: NotificationAudience,
  recipientId?: string | null,
): Promise<Notification> {
  return prisma.notification.create({
    data: {
      title,
      message,
      audience,
      recipientId: recipientId || null,
    },
  });
}

export async function createNotificationsForRecipients(
  title: string,
  message: string,
  audience: NotificationAudience,
  recipientIds: string[],
): Promise<number> {
  if (recipientIds.length === 0) return 0;
  const { count } = await prisma.notification.createMany({
    data: recipientIds.map((recipientId) => ({ title, message, audience, recipientId })),
  });
  return count;
}

// Most recent notifications only — the UI never needs the full history and the
// SSE stream re-sends this list whenever something new arrives.
export const NOTIFICATION_LIMIT = 100;

// Broadcasts (no recipient) go to everyone in the audience; targeted
// notifications (recipientId set) go only to that user. Without the
// recipientId: null guard every student would see every other student's
// personal "Assignment graded — 8/10" notification.
//
// The two halves are queried separately and merged: an OR across them forces
// Postgres to fetch and sort every match, whereas the personal half on its own
// is an ordered (recipientId, createdAt) index scan that stops at LIMIT, and
// broadcasts are few.
function notificationQueries(role?: UserRole, userId?: string) {
  const audienceFilter = role
    ? [notificationAudiences.ALL, roleToAudienceMap[role]]
    : [notificationAudiences.ALL];
  return {
    broadcast: { recipientId: null, audience: { in: audienceFilter } },
    personal: userId ? { recipientId: userId } : null,
  };
}

const newestFirst = (a: { createdAt: Date }, b: { createdAt: Date }) =>
  b.createdAt.getTime() - a.createdAt.getTime();

export async function getNotifications(role?: UserRole, userId?: string): Promise<Notification[]> {
  const { broadcast, personal } = notificationQueries(role, userId);
  const query = { orderBy: { createdAt: "desc" as const }, take: NOTIFICATION_LIMIT };
  const [broadcasts, personals] = await Promise.all([
    prisma.notification.findMany({ where: broadcast, ...query }),
    personal ? prisma.notification.findMany({ where: personal, ...query }) : [],
  ]);
  return [...broadcasts, ...personals].sort(newestFirst).slice(0, NOTIFICATION_LIMIT);
}

export async function getLatestNotificationId(role?: UserRole, userId?: string): Promise<string | null> {
  const { broadcast, personal } = notificationQueries(role, userId);
  const query = { orderBy: { createdAt: "desc" as const }, select: { id: true, createdAt: true } };
  const latest = await Promise.all([
    prisma.notification.findFirst({ where: broadcast, ...query }),
    personal ? prisma.notification.findFirst({ where: personal, ...query }) : null,
  ]);
  const newest = latest.filter((n) => n !== null).sort(newestFirst)[0];
  return newest?.id ?? null;
}
