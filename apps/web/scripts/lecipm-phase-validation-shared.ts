/**
 * Shared helpers for `phase1-validation.ts` … `phase7-validation.ts`.
 * Env: VALIDATION_BASE_URL or LECIPM_PHASE_VALIDATION_URL (default http://127.0.0.1:3001).
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

export function getValidationBase(): string {
  return (
    process.env.VALIDATION_BASE_URL ??
    process.env.LECIPM_PHASE_VALIDATION_URL ??
    "http://127.0.0.1:3001"
  ).replace(/\/$/, "");
}

export async function fetchJson(url: string, init?: RequestInit): Promise<{ res: Response; json: unknown }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { res, json };
}

export function printPhaseHeader(phase: number, title: string): void {
  console.log(`\n========== LECIPM Phase ${phase}: ${title} ==========\n`);
}

export async function assertServerReady(base: string): Promise<boolean> {
  try {
    const { res } = await fetchJson(`${base}/api/ready`);
    return res.ok;
  } catch {
    return false;
  }
}

export type PhaseCheck = { name: string; ok: boolean; detail?: string };

export function summarize(failed: number, phase: number): void {
  console.log("\n----------");
  if (failed === 0) {
    console.log(`PASS — Phase ${phase} validation`);
  } else {
    console.log(`FAIL — Phase ${phase} validation (${failed} check(s))`);
  }
}
