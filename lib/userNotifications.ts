import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "user-notifications.json");

async function ensureFile() {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify({}), "utf8");
  }
}

export async function addUserNotification(userId: string, title: string, message: string) {
  await ensureFile();
  const raw = await fs.readFile(filePath, "utf8");
  const data = raw ? JSON.parse(raw) : {};
  if (!data[userId]) data[userId] = [];
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    message,
    createdAt: new Date().toISOString(),
  };
  data[userId].unshift(notification);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  return notification;
}

export async function getUserNotifications(userId: string) {
  await ensureFile();
  const raw = await fs.readFile(filePath, "utf8");
  const data = raw ? JSON.parse(raw) : {};
  return data[userId] || [];
}
