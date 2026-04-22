import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
  calculateDSCR,
  calculateLTV,
  createCapitalStack,
  getCapitalStack,
  updateCapitalStack,
} from "@/modules/capital/capital-stack.service";
import { canManageCapital } from "@/modules/capital/capital-policy";
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

    const stack = await getCapitalStack(dealId);
    const [ltv, dscr] = stack ? await Promise.all([calculateLTV(dealId), calculateDSCR(dealId)]) : [null, null];

    return NextResponse.json({ capitalStack: stack, derived: { ltv, dscr } });
  } catch (e) {
    logError("[api.deals.capital.get]", { error: e });
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
    const totalPurchasePrice = typeof body.totalPurchasePrice === "number" ? body.totalPurchasePrice : NaN;
    if (!Number.isFinite(totalPurchasePrice) || totalPurchasePrice <= 0) {
      return NextResponse.json({ error: "totalPurchasePrice required" }, { status: 400 });
    }

    const stack = await createCapitalStack(
      dealId,
      {
        totalPurchasePrice,
        equityAmount: typeof body.equityAmount === "number" ? body.equityAmount : undefined,
        debtAmount: typeof body.debtAmount === "number" ? body.debtAmount : undefined,
        noiAnnual: typeof body.noiAnnual === "number" ? body.noiAnnual : undefined,
        annualDebtService: typeof body.annualDebtService === "number" ? body.annualDebtService : undefined,
      },
      auth.userId
    );

    return NextResponse.json({ capitalStack: stack });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.capital.post]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ dealId: string }> }) {
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
    const stack = await updateCapitalStack(
      dealId,
      {
        ...(typeof body.totalPurchasePrice === "number" ? { totalPurchasePrice: body.totalPurchasePrice } : {}),
        ...(typeof body.equityAmount === "number" ? { equityAmount: body.equityAmount } : {}),
        ...(typeof body.debtAmount === "number" ? { debtAmount: body.debtAmount } : {}),
        ...(typeof body.noiAnnual === "number" ? { noiAnnual: body.noiAnnual } : {}),
        ...(typeof body.annualDebtService === "number" ? { annualDebtService: body.annualDebtService } : {}),
      },
      auth.userId
    );

    return NextResponse.json({ capitalStack: stack });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.capital.patch]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
