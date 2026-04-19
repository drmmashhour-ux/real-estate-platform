import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { leadPricingOverrideFlags } from "@/config/feature-flags";
import {
  clearLeadPricingOverride,
  createLeadPricingOverride,
  listLeadPricingOverrides,
  validateOverrideReason,
} from "@/modules/leads/lead-pricing-override.service";

export const dynamic = "force-dynamic";

async function assertAdminPricingOverride() {
  const userId = await getGuestId();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (!leadPricingOverrideFlags.leadPricingOverrideV1) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { userId };
}

/** GET — recent internal override rows for audit (admin only). */
export async function GET(_req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const gate = await assertAdminPricingOverride();
  if ("error" in gate) return gate.error;

  const { leadId } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const history = await listLeadPricingOverrides({ leadId, take: 40 });
  const active = history.find((r) => r.status === "active") ?? null;

  return NextResponse.json({ active, history });
}

/** POST — create operator advisory override (supersedes active). Body: overridePrice, reason, basePriceSnapshot, systemSuggestedSnapshot */
export async function POST(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const gate = await assertAdminPricingOverride();
  if ("error" in gate) return gate.error;

  const { leadId } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reason = validateOverrideReason(body.reason);
  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const overridePrice = typeof body.overridePrice === "number" ? body.overridePrice : Number(body.overridePrice);
  const basePriceSnapshot =
    typeof body.basePriceSnapshot === "number" ? body.basePriceSnapshot : Number(body.basePriceSnapshot);
  const systemSuggestedSnapshot =
    typeof body.systemSuggestedSnapshot === "number"
      ? body.systemSuggestedSnapshot
      : Number(body.systemSuggestedSnapshot);

  try {
    const row = await createLeadPricingOverride({
      leadId,
      actorUserId: gate.userId,
      basePrice: basePriceSnapshot,
      systemSuggestedPrice: systemSuggestedSnapshot,
      overridePrice,
      reason,
    });
    return NextResponse.json({ override: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** DELETE — clear active operator override (marks cleared; audit retained). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const gate = await assertAdminPricingOverride();
  if ("error" in gate) return gate.error;

  const { leadId } = await params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const cleared = await clearLeadPricingOverride(leadId, gate.userId);
  return NextResponse.json({ cleared: cleared ?? null });
}
