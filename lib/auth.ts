import { PrismaClient } from "@prisma/client";
import type { Notification, Role as UserRole, NotificationAudience, User } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
  } catch {
    return null;
  }
}

// Lazily constructed so that importing this module (e.g. during Next.js's
// build-time route analysis) never requires DATABASE_URL to be set — only
// actually using the client at runtime does.
let _prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!_prisma) {
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
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
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

export async function getNotifications(role?: UserRole, userId?: string): Promise<Notification[]> {
  const audienceFilter = role
    ? [notificationAudiences.ALL, roleToAudienceMap[role]]
    : [notificationAudiences.ALL];

  return prisma.notification.findMany({
    where: {
      OR: [
        { audience: { in: audienceFilter } },
        ...(userId ? [{ recipientId: userId }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}
