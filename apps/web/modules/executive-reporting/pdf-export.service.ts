/**
 * Executive report PDF via **Python ReportLab** (`apps/web/scripts/generate_executive_report.py`).
 */

import { execFileSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

import type { ExecutiveReportView } from "./executive-report.types";
import { logExecutivePdfCreated } from "./executive-report.logging";

export type ExecutivePdfResult =
  | { ok: true; pdfPath: string }
  | { ok: false; error: string };

function resolveScriptPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "scripts", "generate_executive_report.py"),
    path.join(process.cwd(), "apps", "web", "scripts", "generate_executive_report.py"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return path.resolve(p);
  }
  return null;
}

/** Deep-clone for JSON: Dates → ISO strings. */
export function jsonSafeExecutivePayload<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, v) => (v instanceof Date ? v.toISOString() : v))) as T;
}

/**
 * Writes JSON to tmp, runs ReportLab script. Does not throw; returns path or error.
 */
export function generateExecutiveReportPdf(view: ExecutiveReportView): ExecutivePdfResult {
  const scriptPath = resolveScriptPath();
  if (!scriptPath) {
    return { ok: false, error: "generate_executive_report.py not found on expected paths." };
  }

  const payload = {
    meta: {
      periodKey: view.periodKey,
      generatedAtUtc: view.generatedAtUtc,
      disclaimer:
        "Figures are drawn from stored operational tables referenced in JSON traces; partial data and definitions are stated in-report.",
    },
    summaryText: view.narrative.summaryText,
    kpi: view.kpi,
    strategy: view.strategy,
    portfolio: view.portfolio,
    investor: view.investor,
    autonomy: view.autonomy,
    recommendations: view.recommendations,
    narrative: view.narrative,
  };

  const dir = os.tmpdir();
  const stamp = Date.now();
  const jsonPath = path.join(dir, `exec-report-${stamp}.json`);
  const pdfPath = path.join(dir, `exec-report-${stamp}.pdf`);

  try {
    writeFileSync(jsonPath, JSON.stringify(jsonSafeExecutivePayload(payload), null, 2), "utf8");
    execFileSync("python3", [scriptPath, jsonPath, pdfPath], {
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
      encoding: "utf8",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    try {
      unlinkSync(jsonPath);
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      error: `PDF generation failed (${msg}). Install: pip install -r apps/web/scripts/requirements-reportlab.txt`,
    };
  } finally {
    try {
      unlinkSync(jsonPath);
    } catch {
      /* ignore */
    }
  }

  if (!existsSync(pdfPath)) {
    return { ok: false, error: "PDF output file was not created." };
  }

  logExecutivePdfCreated({ periodKey: view.periodKey, pdfPath });
  return { ok: true, pdfPath };
}

export function readExecutivePdfFile(filepath: string): Buffer {
  return readFileSync(filepath);
}

export function safeUnlinkExecutivePdf(filepath: string): void {
  try {
    unlinkSync(filepath);
  } catch {
    /* ignore */
  }
}
