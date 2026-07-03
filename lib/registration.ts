import { prisma } from "@/lib/auth";

const KEY = "registration_open";

export async function getRegistrationOpen(): Promise<boolean> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: KEY } });
    if (!setting) return true; // default open
    return setting.value === "true";
  } catch {
    return true;
  }
}

export async function setRegistrationOpen(open: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: String(open) },
    create: { key: KEY, value: String(open) },
  });
}

const registration = { getRegistrationOpen, setRegistrationOpen };
export default registration;
