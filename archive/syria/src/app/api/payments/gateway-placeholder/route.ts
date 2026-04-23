import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";

/**
 * Local / regional gateway placeholder — replace with real PSP integration.
 * Does not move money; returns a synthetic reference for tracing.
 */
export async function POST(req: Request) {
  assertDarlinkRuntimeEnv();
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* optional body */
  }

  const reference = `SYR-GW-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return NextResponse.json({
    ok: true,
    mode: "placeholder",
    reference,
    echo: body,
    note: "Wire your domestic PSP here; keep payment status updated via admin verification.",
  });
}
