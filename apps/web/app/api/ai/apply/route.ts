import { z } from "zod";
import { executeActions, type AutonomousAction, type ExecuteContext } from "@/lib/ai/executor";
import { getGuestId } from "@/lib/auth/session";
import { getListingsDB, monolithPrisma } from "@/lib/db";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

const AutonomousActionZ = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("listing_improvement"),
    issues: z.array(z.string()),
    actions: z.array(z.string()),
  }),
  z.object({
    type: z.literal("price_update"),
    newPrice: z.number(),
    changePct: z.number().optional(),
  }),
  z.object({
    type: z.literal("compliance_block"),
    message: z.string(),
  }),
]);

const BodyZ = z.object({
  actions: z.array(AutonomousActionZ).min(1),
  ctx: z
    .object({
      marketplaceListingId: z.string().min(1).optional(),
      crmListingId: z.string().min(1).optional(),
      shortTermListingId: z.string().min(1).optional(),
    })
    .refine(
      (c) => Boolean(c.marketplaceListingId) || Boolean(c.shortTermListingId),
      { message: "ctx.marketplaceListingId or ctx.shortTermListingId is required" }
    ),
});

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/ai/apply", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { actions, ctx: rawCtx } = parsed.data;
  const ctx: ExecuteContext = { ...rawCtx };

  if (rawCtx.shortTermListingId) {
    const st = await monolithPrisma.shortTermListing.findFirst({
      where: { id: rawCtx.shortTermListingId, ownerId: userId },
      select: { id: true },
    });
    if (!st) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  if (rawCtx.marketplaceListingId) {
    const row = await getListingsDB().listing.findFirst({
      where: { id: rawCtx.marketplaceListingId, userId },
      select: { id: true },
    });
    if (!row) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    await executeActions(actions as AutonomousAction[], ctx);
  } catch (e) {
    logError(e, { route: "/api/ai/apply", phase: "executeActions" });
    return Response.json({ error: "Execution failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
