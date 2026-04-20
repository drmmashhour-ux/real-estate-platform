/**
 * Generates a BNHub investor/board PDF via **Python ReportLab** (`scripts/generate_report.py`).
 * Requires `python3` and `pip install -r apps/web/scripts/requirements-reportlab.txt` on the host.
 */

import { execFileSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

export type BnhubPdfReportPayload = Record<string, unknown>;

function resolveGenerateReportPy(): string {
  const candidates = [
    path.join(process.cwd(), "scripts", "generate_report.py"),
    path.join(process.cwd(), "apps", "web", "scripts", "generate_report.py"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return path.resolve(p);
  }
  throw new Error(
    "generate_report.py not found (expected apps/web/scripts/generate_report.py from repo or app cwd)."
  );
}

/** Deep-clone for JSON: Dates → ISO strings. */
export function jsonSafePayload<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, v) => (v instanceof Date ? v.toISOString() : v))) as T;
}

/**
 * Writes JSON to tmp, runs ReportLab script, returns absolute path to PDF (caller should delete after streaming).
 */
export async function generateBnhubInvestorReportPdf(payload: BnhubPdfReportPayload): Promise<string> {
  const scriptPath = resolveGenerateReportPy();
  const dir = os.tmpdir();
  const stamp = Date.now();
  const jsonPath = path.join(dir, `bnhub-report-${stamp}.json`);
  const pdfPath = path.join(dir, `bnhub-report-${stamp}.pdf`);

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");

  try {
    execFileSync("python3", [scriptPath, jsonPath, pdfPath], {
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
      encoding: "utf8",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `PDF generation failed (${msg}). Ensure Python 3 and ReportLab are installed: pip install -r apps/web/scripts/requirements-reportlab.txt`
    );
  } finally {
    try {
      unlinkSync(jsonPath);
    } catch {
      /* tmp cleanup best-effort */
    }
  }

  if (!existsSync(pdfPath)) {
    throw new Error("PDF output file was not created.");
  }

  return pdfPath;
}

export function readPdfFile(filepath: string): Buffer {
  return readFileSync(filepath);
}

export function safeUnlink(filepath: string): void {
  try {
    unlinkSync(filepath);
  } catch {
    /* ignore */
  }
}

/** Alias for callers that match the original `generateInvestorReport` naming. */
export const generateInvestorReport = generateBnhubInvestorReportPdf;
