import { NextRequest } from "next/server";
import { z } from "zod";
import { cronNotConfigured, cronUnauthorized, verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { evaluateFraudRisk } from "@/src/modules/fraud/fraud.engine";
import { evaluateUserTrust, evaluateFsboListingTrust } from "@/src/modules/trust/trust.engine";
import type { FraudEntityType } from "@/src/modules/fraud/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  fraud: z
    .object({
      entityType: z.enum(["listing", "review", "user", "host", "booking"]),
      entityId: z.string().min(1),
    })
    .optional(),
  userTrust: z.object({ userId: z.string().min(1) }).optional(),
  fsboTrust: z.object({ listingId: z.string().min(1) }).optional(),
});

/**
 * POST /api/internal/fraud-trust/evaluate — batch evaluation for jobs (Bearer CRON_SECRET).
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const out: {
    fraud?: unknown;
    userTrust?: unknown;
    fsboTrust?: unknown;
  } = {};

  if (parsed.data.fraud) {
    const { entityType, entityId } = parsed.data.fraud;
    out.fraud = await evaluateFraudRisk(entityType as FraudEntityType, entityId, { persist: true });
  }
  if (parsed.data.userTrust) {
    out.userTrust = await evaluateUserTrust(parsed.data.userTrust.userId);
  }
  if (parsed.data.fsboTrust) {
    out.fsboTrust = await evaluateFsboListingTrust(parsed.data.fsboTrust.listingId);
  }

  return Response.json({ ok: true, ...out });
}
