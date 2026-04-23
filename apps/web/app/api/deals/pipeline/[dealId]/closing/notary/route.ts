import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
  assignNotary,
  markSigningStarted,
  prepareFinalDocumentSet,
  simulateSendToNotary,
} from "@/modules/closing/closing.service";
import { canManageClosing } from "@/modules/closing/closing-policy";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageClosing(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "assign") {
      const name = typeof body.name === "string" ? body.name : "";
      const email = typeof body.email === "string" ? body.email : null;
      if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
      const closing = await assignNotary(dealId, name, email, auth.userId);
      return NextResponse.json({ closing });
    }

    if (action === "prepare") {
      const closing = await prepareFinalDocumentSet(dealId, auth.userId);
      return NextResponse.json({ closing });
    }

    if (action === "send") {
      const closing = await simulateSendToNotary(dealId, auth.userId);
      return NextResponse.json({ closing });
    }

    if (action === "signing") {
      const closing = await markSigningStarted(dealId, auth.userId);
      return NextResponse.json({ closing });
    }

    return NextResponse.json({ error: "action must be assign|prepare|send|signing" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.closing.notary]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
