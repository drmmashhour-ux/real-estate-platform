import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";

/** Primary enforcement: `proxy.ts` (Next.js 16+) + `lib/demo-mode-api.ts`. */
export { blockIfDemoWrite } from "@/lib/demo-mode-api";

/** @deprecated Prefer `blockIfDemoWrite(request)` which logs + returns JSON. */
export function shouldBlockDemoWrite(): boolean {
  return isDemoMode();
}

/** @deprecated Prefer `blockIfDemoWrite(request)`. */
export function demoWriteForbiddenResponse(): NextResponse {
  return NextResponse.json(
    { error: "Demo mode — this action is disabled", code: "DEMO_MODE" },
    { status: 403 }
  );
}
