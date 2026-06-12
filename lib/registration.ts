import fs from "fs/promises";
import path from "path";

const REG_FILE = path.join(process.cwd(), "data", "registration.json");

export async function getRegistrationOpen(): Promise<boolean> {
  try {
    const raw = await fs.readFile(REG_FILE, "utf-8");
    const obj = JSON.parse(raw);
    return Boolean(obj.open);
  } catch (err) {
    // default to open if file missing or unreadable
    console.error("Failed to read registration flag, defaulting to open:", err);
    return true;
  }
}

export async function setRegistrationOpen(open: boolean): Promise<void> {
  const payload = { open };
  await fs.mkdir(path.dirname(REG_FILE), { recursive: true });
  await fs.writeFile(REG_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export default { getRegistrationOpen, setRegistrationOpen };
