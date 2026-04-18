/**
 * Light client-side reachable checks from the validator (homepage + /api/ready).
 */
export type LightPerformanceResult = {
  status: "PASS" | "WARNING" | "FAIL";
  detail: string;
  homepageMs?: number;
  apiReadyMs?: number;
  homepageStatus?: number;
};

export async function runLightPerformanceCheck(baseUrl: string, localePath = "/en/ca"): Promise<LightPerformanceResult> {
  const root = baseUrl.replace(/\/$/, "");
  const pageUrl = `${root}${localePath.startsWith("/") ? localePath : `/${localePath}`}`;
  const warnings: string[] = [];

  let homepageMs: number | undefined;
  let homepageStatus: number | undefined;
  try {
    const t0 = Date.now();
    const ctrl = typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(20_000) : undefined;
    const res = await fetch(pageUrl, { signal: ctrl, redirect: "follow" });
    homepageMs = Date.now() - t0;
    homepageStatus = res.status;
    if (!res.ok) {
      return {
        status: "FAIL",
        detail: `Homepage ${pageUrl} HTTP ${res.status}`,
        homepageMs,
        homepageStatus,
      };
    }
    if (homepageMs > 3000) {
      warnings.push(`Homepage TTFB+download ${homepageMs}ms (threshold 3000ms)`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      status: "FAIL",
      detail: `Homepage fetch failed: ${msg}`,
    };
  }

  let apiReadyMs: number | undefined;
  try {
    const t1 = Date.now();
    const ctrl = typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(15_000) : undefined;
    const res = await fetch(`${root}/api/ready`, { signal: ctrl });
    apiReadyMs = Date.now() - t1;
    if (!res.ok) {
      return {
        status: "FAIL",
        detail: `GET /api/ready HTTP ${res.status}`,
        homepageMs,
        apiReadyMs,
        homepageStatus,
      };
    }
    if (apiReadyMs > 1000) {
      warnings.push(`/api/ready ${apiReadyMs}ms (threshold 1000ms)`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      status: "FAIL",
      detail: `/api/ready failed: ${msg}`,
      homepageMs,
      homepageStatus,
    };
  }

  if (warnings.length > 0) {
    return {
      status: "WARNING",
      detail: warnings.join(" · "),
      homepageMs,
      apiReadyMs,
      homepageStatus,
    };
  }

  return {
    status: "PASS",
    detail: `Homepage OK (${homepageMs}ms), /api/ready OK (${apiReadyMs}ms)`,
    homepageMs,
    apiReadyMs,
    homepageStatus,
  };
}
