import { PrismaClient } from "@prisma/client";
import type { Notification, Role as UserRole, NotificationAudience, User } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// Ensure required environment variables are available
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

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

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

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

export type SafeUser = Pick<User, "id" | "name" | "email" | "role" | "status">;

export async function getUsers(role?: UserRole): Promise<SafeUser[]> {
  return prisma.user.findMany({
    where: role ? { role } : undefined,
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, status: true },
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
