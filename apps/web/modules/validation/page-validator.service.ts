/**
 * HTTP-level page probes (no headless browser). Console errors require Playwright separately.
 */
import type { PageValidationResult, PageValidationStatus } from "./types";

const DEFAULT_TIMEOUT_MS = 25_000;
const SLOW_MS = 8000;

function classifyStatus(status: number): { ok: boolean; note?: string } {
  if (status >= 200 && status < 400) return { ok: true };
  if (status === 401 || status === 403) return { ok: true, note: "auth_required" };
  if (status === 307 || status === 308 || status === 302 || status === 301) return { ok: true, note: "redirect" };
  return { ok: false };
}

function htmlSanity(html: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const lower = html.slice(0, 500_000).toLowerCase();
  if (!lower.includes("<html")) errors.push("missing_<html>");
  if (lower.includes("application error") && lower.includes("next")) errors.push("possible_next_error_boundary");
  if (lower.includes("internal server error")) errors.push("internal_server_error_text");
  return { ok: errors.length === 0, errors };
}

export type ValidatePageOptions = {
  baseUrl: string;
  path: string;
  timeoutMs?: number;
  /** Treat 401/403 as pass (protected surface) */
  allowAuthWall?: boolean;
};

/**
 * GET a page; returns structured result with evidence (never fabricates success).
 */
export async function validatePage(opts: ValidatePageOptions): Promise<PageValidationResult> {
  const { baseUrl, path, timeoutMs = DEFAULT_TIMEOUT_MS, allowAuthWall = true } = opts;
  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const errors: string[] = [];
  const warnings: string[] = [];
  const t0 = Date.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "LECIPM-PlatformValidation/1.0",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      route: path,
      status: "fail",
      errors: [`fetch_failed: ${msg}`],
      warnings,
      evidence: { url },
    };
  }

  const loadTimeMs = Date.now() - t0;
  const httpStatus = res.status;
  const { ok, note } = classifyStatus(httpStatus);

  if (loadTimeMs > SLOW_MS) {
    warnings.push(`slow_load_${loadTimeMs}ms_threshold_${SLOW_MS}`);
  }

  if (!ok) {
    errors.push(`http_${httpStatus}`);
    return {
      route: path,
      status: "fail",
      httpStatus,
      errors,
      warnings,
      loadTimeMs,
      evidence: { url, note },
    };
  }

  if ((httpStatus === 401 || httpStatus === 403) && allowAuthWall) {
    warnings.push("protected_route_auth_wall");
    return {
      route: path,
      status: "pass",
      httpStatus,
      errors: [],
      warnings,
      loadTimeMs,
      evidence: { url, note: "auth_wall" },
    };
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
    warnings.push(`unexpected_content_type:${ct}`);
  }

  let body = "";
  try {
    body = await res.text();
  } catch (e) {
    errors.push(`body_read_failed:${e instanceof Error ? e.message : String(e)}`);
    return {
      route: path,
      status: "fail",
      httpStatus,
      errors,
      warnings,
      loadTimeMs,
      evidence: { url },
    };
  }

  const sanity = htmlSanity(body);
  if (!sanity.ok) {
    for (const s of sanity.errors) errors.push(`html:${s}`);
  }

  const status: PageValidationStatus = errors.length ? "fail" : note ? "warn" : "pass";
  return {
    route: path,
    status: status === "warn" ? "pass" : status,
    httpStatus,
    errors,
    warnings: note ? [...warnings, `http_note:${note}`] : warnings,
    loadTimeMs,
    evidence: { url, bytes: body.length },
  };
}

export function percentileMs(samples: number[], p: number): number | undefined {
  if (samples.length === 0) return undefined;
  const s = [...samples].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}
