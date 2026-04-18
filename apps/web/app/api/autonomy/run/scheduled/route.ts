import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { runScheduledBodySchema } from "@/modules/autonomous-marketplace/api/zod-schemas";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!engineFlags.autonomousMarketplaceV1) {
    return NextResponse.json({ error: "Autonomous marketplace disabled" }, { status: 403 });
  }
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const parsed = runScheduledBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const summary = await autonomousMarketplaceEngine.runScheduledScan({ mode: parsed.data.mode });
  return NextResponse.json({ ok: true, summary });
}
