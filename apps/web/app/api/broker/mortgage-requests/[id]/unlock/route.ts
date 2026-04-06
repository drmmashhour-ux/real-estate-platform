import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBrokerApiSession } from "@/modules/mortgage/services/broker-dashboard-api";
import { isMortgageLeadUnlockedForBroker } from "@/modules/mortgage/services/broker-lead-limits";
import { applyMortgageContactUnlock } from "@/modules/mortgage/services/apply-mortgage-contact-unlock";
import {
  countProFreeWeeklyUnlocks,
  PRO_WEEKLY_FREE_CONTACT_UNLOCKS,
} from "@/modules/mortgage/services/mortgage-unlock-weekly";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { getPublicAppUrl } from "@/lib/config/public-app-url";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function appBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return getPublicAppUrl();
}

/** Unlock borrower email/phone on a mortgage lead (free weekly quota for Pro, else paid Checkout). */
export async function POST(req: Request, ctx: RouteCtx) {
  const session = await getBrokerApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  if (session.isAdmin) {
    return NextResponse.json({ error: "Admin unlock is not applicable" }, { status: 400 });
  }

  const { id: mortgageRequestId } = await ctx.params;

  const row = await prisma.mortgageRequest.findFirst({
    where: { id: mortgageRequestId, brokerId: session.brokerId },
    select: {
      id: true,
      leadValue: true,
      contactUnlocked: true,
      unlockedByBrokerId: true,
    },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const listUnlocked = await isMortgageLeadUnlockedForBroker(session.brokerId, mortgageRequestId, session.plan);
  if (!listUnlocked) {
    return NextResponse.json(
      { error: "Upgrade to Pro to access this lead", code: "LEAD_LOCKED" },
      { status: 403 }
    );
  }

  if (row.contactUnlocked && row.unlockedByBrokerId === session.brokerId) {
    return NextResponse.json({ ok: true, alreadyUnlocked: true });
  }

  if (enforceableContractsRequired()) {
    const signed = await hasActiveEnforceableContract(session.brokerId, ENFORCEABLE_CONTRACT_TYPES.BROKER, {});
    if (!signed) {
      return NextResponse.json(
        {
          error:
            "Sign the platform broker collaboration agreement before unlocking borrower contact (ContractSign kind=broker).",
          code: "ENFORCEABLE_BROKER_REQUIRED",
        },
        { status: 403 }
      );
    }
  }

  const plan = session.plan;
  const usedFree = await countProFreeWeeklyUnlocks(session.brokerId);
  const canUseProFree = plan === "pro" && usedFree < PRO_WEEKLY_FREE_CONTACT_UNLOCKS;

  if (canUseProFree) {
    const result = await applyMortgageContactUnlock({
      mortgageRequestId,
      mortgageBrokerId: session.brokerId,
      amountCents: 0,
      source: "free_weekly",
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === "already_unlocked_other" ? "Lead already unlocked" : "Unlock failed" },
        { status: result.reason === "already_unlocked_other" ? 409 : 400 }
      );
    }
    return NextResponse.json({ ok: true, unlocked: true, source: "free_weekly" });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured. Contact support to unlock this lead." },
      { status: 503 }
    );
  }

  const amountCents = Math.round(row.leadValue * 100);
  if (amountCents < 1) {
    return NextResponse.json({ error: "Invalid lead price" }, { status: 400 });
  }

  const base = appBaseUrl(req);
  const checkout = await createCheckoutSession({
    successUrl: `${base}/broker/dashboard?unlock=success`,
    cancelUrl: `${base}/broker/dashboard?unlock=cancel`,
    amountCents,
    currency: "cad",
    paymentType: "mortgage_contact_unlock",
    userId: session.userId,
    mortgageRequestId,
    mortgageBrokerId: session.brokerId,
    description: "Mortgage lead — unlock borrower contact",
  });

  if ("error" in checkout) {
    return NextResponse.json({ error: checkout.error }, { status: 400 });
  }

  return NextResponse.json({ checkoutUrl: checkout.url });
}
