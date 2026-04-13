import fs from "node:fs/promises";
import path from "node:path";

export function contentMachineDataDir(): string {
  const raw = process.env.CONTENT_MACHINE_DATA_DIR?.trim();
  const base = raw || path.join(process.cwd(), ".data", "content-machine");
  return base;
}

export async function ensureContentMachineDir(): Promise<string> {
  const dir = contentMachineDataDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function contentMachineFilePath(contentId: string, ext: "jpg" | "mp4" = "jpg"): string {
  const safe = contentId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return path.join(contentMachineDataDir(), `${safe}.${ext}`);
}
