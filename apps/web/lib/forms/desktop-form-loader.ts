import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const ALLOWED_TYPES = new Set([".pdf", ".docx", ".txt"]);
const DEFAULT_FORMS_DIR = path.join(os.homedir(), "Desktop", "real estate forms folder");

export type DesktopFormListItem = {
  name: string;
  path: string;
  type: string;
  sizeBytes: number;
  modifiedAt: string;
};

export function getDesktopFormsDirectory() {
  return process.env.REAL_ESTATE_FORMS_DIR?.trim() || DEFAULT_FORMS_DIR;
}

export async function listDesktopForms(): Promise<DesktopFormListItem[]> {
  const formsDir = getDesktopFormsDirectory();
  const entries = await fs.readdir(formsDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const ext = path.extname(entry.name).toLowerCase();
        if (!ALLOWED_TYPES.has(ext)) {
          return null;
        }

        const fullPath = path.join(formsDir, entry.name);
        const stats = await fs.stat(fullPath);
        return {
          name: entry.name,
          path: fullPath,
          type: ext,
          sizeBytes: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        } satisfies DesktopFormListItem;
      })
  );

  return files
    .filter((item): item is DesktopFormListItem => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function readDesktopFormText(fileName: string) {
  const formsDir = getDesktopFormsDirectory();
  const safeName = path.basename(fileName);
  const fullPath = path.join(formsDir, safeName);
  const ext = path.extname(safeName).toLowerCase();

  if (!ALLOWED_TYPES.has(ext)) {
    throw new Error("Unsupported file type.");
  }

  await fs.access(fullPath);
  const buffer = await fs.readFile(fullPath);
  const text = await extractTextByType(buffer, ext);

  return {
    name: safeName,
    path: fullPath,
    type: ext,
    text,
  };
}

async function extractTextByType(buffer: Buffer, ext: string) {
  if (ext === ".txt") {
    return buffer.toString("utf8");
  }

  if (ext === ".pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text ?? "";
  }

  if (ext === ".docx") {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value ?? "";
  }

  throw new Error("Unsupported file type.");
}
