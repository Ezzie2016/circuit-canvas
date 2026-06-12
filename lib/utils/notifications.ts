import type { Notification } from "../../types";

export function createNotification(
  title: string,
  message: string,
  audience: Notification["audience"],
): Notification {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    message,
    audience,
    createdAt: new Date().toISOString().slice(0, 10),
    readBy: [],
  };
}