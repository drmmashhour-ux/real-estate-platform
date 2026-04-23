import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canManageCapital } from "@/modules/capital/capital-policy";
import { addLender, listLenders } from "@/modules/capital/lender.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lenders = await listLenders(dealId);
    return NextResponse.json({ lenders });
  } catch (e) {
    logError("[api.deals.lenders.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageCapital(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const lenderName = typeof body.lenderName === "string" ? body.lenderName.trim() : "";
    if (!lenderName) return NextResponse.json({ error: "lenderName required" }, { status: 400 });

    const lender = await addLender(
      dealId,
      {
        lenderName,
        contactName: typeof body.contactName === "string" ? body.contactName : undefined,
        contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      },
      auth.userId
    );

    return NextResponse.json({ lender });
  } catch (e) {
    logError("[api.deals.lenders.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
