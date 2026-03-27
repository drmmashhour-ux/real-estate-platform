import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SystemValidationReport } from "@/src/modules/system-validation/types";

const DIR = path.join(process.cwd(), ".system-validation");
const FILE = path.join(DIR, "last-report.json");

export async function saveSystemValidationReport(report: SystemValidationReport): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(report, null, 2), "utf8");
}

export async function loadSystemValidationReport(): Promise<SystemValidationReport | null> {
  try {
    const raw = await readFile(FILE, "utf8");
    return JSON.parse(raw) as SystemValidationReport;
  } catch {
    return null;
  }
}
