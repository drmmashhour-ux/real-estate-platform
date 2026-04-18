/**
 * API smoke checks — status codes and basic JSON shape hints.
 */
import type { ApiCheckResult, PageValidationStatus } from "./types";

export type ApiProbe = {
  name: string;
  method: "GET" | "POST" | "HEAD";
  path: string;
  /** Inclusive */
  expectStatusMin?: number;
  /** Inclusive */
  expectStatusMax?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

const DEFAULT_TIMEOUT_MS = 20_000;

function statusForProbe(p: ApiProbe, httpStatus: number): PageValidationStatus {
  const min = p.expectStatusMin ?? 200;
  const max = p.expectStatusMax ?? 299;
  if (httpStatus >= min && httpStatus <= max) return "pass";
  return "fail";
}

export async function runApiProbe(baseUrl: string, probe: ApiProbe): Promise<ApiCheckResult> {
  const url = `${baseUrl.replace(/\/$/, "")}${probe.path.startsWith("/") ? probe.path : `/${probe.path}`}`;
  const errors: string[] = [];
  const warnings: string[] = [];
  const t0 = Date.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method: probe.method,
      redirect: "manual",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        "User-Agent": "LECIPM-PlatformValidation/1.0",
        ...probe.headers,
      },
      body:
        probe.body !== undefined && probe.method !== "GET" && probe.method !== "HEAD"
          ? JSON.stringify(probe.body)
          : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      name: probe.name,
      method: probe.method,
      path: probe.path,
      status: "fail",
      errors: [`fetch_failed: ${msg}`],
      warnings,
    };
  }

  const responseTimeMs = Date.now() - t0;
  const httpStatus = res.status;
  const st = statusForProbe(probe, httpStatus);
  if (st === "fail") {
    errors.push(`expected_status_[${probe.expectStatusMin ?? 200},${probe.expectStatusMax ?? 299}]_got_${httpStatus}`);
  }

  if (probe.method === "GET" && res.headers.get("content-type")?.includes("json") && httpStatus < 500) {
    try {
      await res.clone().json();
    } catch {
      warnings.push("response_not_valid_json");
    }
  }

  return {
    name: probe.name,
    method: probe.method,
    path: probe.path,
    status: st,
    expectedMin: probe.expectStatusMin,
    expectedMax: probe.expectStatusMax,
    httpStatus,
    errors,
    warnings,
    responseTimeMs,
  };
}

/** Curated API probes — extend as needed. */
export function defaultApiProbes(): ApiProbe[] {
  return [
    {
      name: "ready",
      method: "GET",
      path: "/api/ready",
      expectStatusMin: 200,
      expectStatusMax: 299,
    },
    {
      name: "health",
      method: "GET",
      path: "/api/health",
      expectStatusMin: 200,
      expectStatusMax: 299,
    },
    {
      name: "auth_login_rejects_empty",
      method: "POST",
      path: "/api/auth/login",
      body: {},
      expectStatusMin: 400,
      expectStatusMax: 422,
    },
  ];
}
