/**
 * Deterministic structural integrity gate for BNHUB + stays + core app wiring.
 * Does not touch git working tree (no destructive cleanup).
 *
 * Run: pnpm --filter @lecipm/web run ci:integrity
 * Output: apps/web/.integrity-report.json
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPORT_PATH = join(WEB_ROOT, ".integrity-report.json");

type CheckResult = { path: string; ok: boolean; reason?: string };
type Report = {
  generatedAt: string;
  webRoot: string;
  critical: CheckResult[];
  contentChecks: CheckResult[];
  passed: boolean;
};

const CRITICAL_FILES = [
  "app/bnhub/[id]/page.tsx",
  "app/bnhub/bnhub-listing-view.tsx",
  "app/stays/[slug]/page.tsx",
  "app/bnhub/booking-form.tsx",
  "app/bnhub/listing-image-gallery.tsx",
  "app/bnhub/availability-calendar.tsx",
  "prisma/schema.prisma",
  "lib/auth/protected-route-segment.ts",
] as const;

function fileExistsNonEmpty(relative: string): CheckResult {
  const abs = join(WEB_ROOT, relative);
  try {
    const st = statSync(abs);
    if (!st.isFile()) return { path: relative, ok: false, reason: "not a file" };
    if (st.size === 0) return { path: relative, ok: false, reason: "empty file" };
    return { path: relative, ok: true };
  } catch {
    return { path: relative, ok: false, reason: "missing or unreadable" };
  }
}

function readUtf8(relative: string): string {
  return readFileSync(join(WEB_ROOT, relative), "utf8");
}

function contentChecks(): CheckResult[] {
  const out: CheckResult[] = [];
  const bnhubPage = "app/bnhub/[id]/page.tsx";
  try {
    const src = readUtf8(bnhubPage);
    if (!src.includes("bnhub-listing-view") && !src.includes("BnhubListingView")) {
      out.push({
        path: bnhubPage,
        ok: false,
        reason: "must import BnhubListingView / bnhub-listing-view",
      });
    } else {
      out.push({ path: `${bnhubPage} (wrapper)`, ok: true });
    }
  } catch (e) {
    out.push({ path: bnhubPage, ok: false, reason: String(e) });
  }

  const view = "app/bnhub/bnhub-listing-view.tsx";
  try {
    const src = readUtf8(view);
    const need = ["ListingImageGallery", "BookingForm", "AvailabilityCalendar"];
    const missing = need.filter((n) => !src.includes(n));
    if (missing.length) {
      out.push({
        path: view,
        ok: false,
        reason: `missing expected UI symbols: ${missing.join(", ")}`,
      });
    } else {
      out.push({ path: `${view} (BNHUB UI)`, ok: true });
    }
  } catch (e) {
    out.push({ path: view, ok: false, reason: String(e) });
  }

  const stays = "app/stays/[slug]/page.tsx";
  try {
    const src = readUtf8(stays);
    if (!src.includes("BnhubListingView") && !src.includes("bnhub-listing-view")) {
      out.push({
        path: stays,
        ok: false,
        reason: "must reuse BnhubListingView",
      });
    } else {
      out.push({ path: `${stays} (stays route)`, ok: true });
    }
  } catch (e) {
    out.push({ path: stays, ok: false, reason: String(e) });
  }

  return out;
}

async function main(): Promise<void> {
  const critical = CRITICAL_FILES.map((p) => fileExistsNonEmpty(p));
  const content = contentChecks();
  const failed = [...critical, ...content].filter((c) => !c.ok);
  const report: Report = {
    generatedAt: new Date().toISOString(),
    webRoot: WEB_ROOT,
    critical,
    contentChecks: content,
    passed: failed.length === 0,
  };

  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`[ci:integrity] Report: ${REPORT_PATH}`);
  for (const c of critical) {
    console.log(`  [${c.ok ? "OK" : "FAIL"}] ${c.path}${c.reason ? ` — ${c.reason}` : ""}`);
  }
  for (const c of content) {
    console.log(`  [${c.ok ? "OK" : "FAIL"}] ${c.path}${c.reason ? ` — ${c.reason}` : ""}`);
  }

  if (!report.passed) {
    console.error("[ci:integrity] FAILED — critical structure or wiring broken");
    process.exit(1);
  }
  console.log("[ci:integrity] PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
