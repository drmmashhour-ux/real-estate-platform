import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import type { DrBrainAppId, DrBrainCheckResult } from "../types";

/**
 * Optional subprocess typecheck — disabled unless DRBRAIN_INCLUDE_BUILD=1/true.
 */
export function runBuildChecks(input: {
  appId: DrBrainAppId;
  appRootAbsolute: string;
}): DrBrainCheckResult[] {
  const { appId, appRootAbsolute } = input;
  const flag = process.env.DRBRAIN_INCLUDE_BUILD?.trim().toLowerCase();
  const enabled = flag === "1" || flag === "true" || flag === "yes";

  if (!enabled) {
    return [
      {
        appId,
        check: "build.typecheck",
        level: "INFO",
        ok: true,
        message: "Build/typecheck skipped (set DRBRAIN_INCLUDE_BUILD=true to enable).",
      },
    ];
  }

  if (!existsSync(appRootAbsolute)) {
    return [
      {
        appId,
        check: "build.typecheck",
        level: "WARNING",
        ok: false,
        message: `App root not found: ${appRootAbsolute}`,
      },
    ];
  }

  const r = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "tsc", "--noEmit"],
    {
      cwd: appRootAbsolute,
      encoding: "utf8",
      shell: false,
      env: { ...process.env },
    },
  );

  const ok = r.status === 0;
  return [
    {
      appId,
      check: "build.typecheck",
      level: ok ? "OK" : "CRITICAL",
      ok,
      message: ok ? "TypeScript check passed." : `TypeScript check failed (exit ${String(r.status)}).`,
      metadata: ok ? undefined : { stderrSnippet: (r.stderr ?? "").slice(0, 500) },
    },
  ];
}
