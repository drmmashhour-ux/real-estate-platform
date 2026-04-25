import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { runFullSystemTest } from "@/src/modules/system-validation/runFullSystemTest";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let skipScaling = false;
  let scalingConcurrency: number | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body === "object") {
      if (body.skipScaling === true) skipScaling = true;
      const c = Number(body.scalingConcurrency);
      if (Number.isFinite(c) && c > 0) scalingConcurrency = Math.min(200, c);
    }
  } catch {
    /* use defaults */
  }

  try {
    const report = await runFullSystemTest({ skipScaling, scalingConcurrency });
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Run failed";
    console.error("[system-validation/run]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
