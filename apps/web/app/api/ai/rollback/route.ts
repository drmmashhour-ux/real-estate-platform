import { z } from "zod";
import { getListingsDB, monolithPrisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { getGuestId } from "@/lib/auth/session";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({ logId: z.string().min(1) });

type Snapshot = Record<string, unknown> | null;

function getSnapshotValue(s: unknown): Snapshot {
  if (s === null || s === undefined) return null;
  if (typeof s === "object" && !Array.isArray(s)) {
    return s as Record<string, unknown>;
  }
  return null;
}

/**
 * Restores a prior `before_snapshot` in one DB transaction per store (monolith for BNHub; marketplace
 * listing + audit log is two-phase with compensation if audit insert fails after price write).
 */
export async function POST(req: Request) {
  if (isDemoMode) {
    return Response.json({ ok: true, demo: true });
  }
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/ai/rollback", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { logId } = parsed.data;

  const logRow = await monolithPrisma.aiExecutionLog.findFirst({
    where: { id: logId },
  });
  if (!logRow) {
    return Response.json({ error: "Log not found" }, { status: 404 });
  }
  if (!logRow.listingId) {
    return Response.json({ error: "Nothing to roll back" }, { status: 400 });
  }

  const before = getSnapshotValue(logRow.beforeSnapshot);
  if (!before) {
    return Response.json({ error: "No before snapshot" }, { status: 400 });
  }

  const listingId = logRow.listingId;
  const hasPc = typeof before.nightPriceCents === "number";
  const hasPrice = typeof before.price === "number";
  if (hasPc && hasPrice && before.source !== "marketplace" && before.source !== "bnhub") {
    return Response.json({ error: "Ambiguous snapshot" }, { status: 400 });
  }
  const scope: "marketplace" | "bnhub" | null =
    before.source === "marketplace"
      ? "marketplace"
      : before.source === "bnhub"
        ? "bnhub"
        : hasPc
          ? "bnhub"
          : hasPrice
            ? "marketplace"
            : null;
  if (scope === null) {
    return Response.json({ error: "Unrecognized snapshot" }, { status: 400 });
  }

  if (scope === "marketplace") {
    if (before.price == null || typeof before.price !== "number") {
      return Response.json({ error: "Invalid backup" }, { status: 400 });
    }
    const beforePrice = before.price;
    const m = await getListingsDB().listing.findFirst({
      where: { id: listingId, userId },
      select: { id: true, price: true },
    });
    if (!m) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const previousPrice = m.price;
    const listings = getListingsDB();
    try {
      await listings.$transaction(async (tx) => {
        const r = await tx.listing.updateMany({
          where: { id: listingId, userId },
          data: { price: beforePrice },
        });
        if (r.count === 0) {
          throw new Error("forbidden");
        }
      });
    } catch (e) {
      if (e instanceof Error && e.message === "forbidden") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      console.error("[ROLLBACK ERROR]", e);
      return Response.json({ error: "Rollback failed" }, { status: 500 });
    }

    try {
      await monolithPrisma.aiExecutionLog.create({
        data: {
          listingId,
          action: JSON.stringify({ type: "rollback", fromLogId: logId, scope: "marketplace" }).slice(0, 16_000),
          beforeSnapshot: { price: previousPrice, source: "marketplace" as const },
          afterSnapshot: { price: beforePrice, source: "marketplace" as const },
        },
      });
    } catch (auditErr) {
      try {
        await listings.listing.update({
          where: { id: listingId, userId },
          data: { price: previousPrice },
        });
      } catch (revertErr) {
        logError(revertErr, { route: "/api/ai/rollback", phase: "compensate_marketplace" });
      }
      logError(auditErr, { route: "/api/ai/rollback", phase: "audit_log_marketplace" });
      return Response.json({ error: "Rollback failed" }, { status: 500 });
    }

    return Response.json({ ok: true, scope: "marketplace" as const });
  }

  if (scope === "bnhub") {
    if (before.nightPriceCents == null || typeof before.nightPriceCents !== "number") {
      return Response.json({ error: "Invalid backup" }, { status: 400 });
    }
    const beforeCents = before.nightPriceCents;
    const st = await monolithPrisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true, nightPriceCents: true },
    });
    if (!st) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const previousCents = st.nightPriceCents;
    const action = JSON.stringify({ type: "rollback", fromLogId: logId, scope: "bnhub" }).slice(0, 16_000);
    const beforeSn = { nightPriceCents: previousCents, source: "bnhub" as const };
    const afterSn = { nightPriceCents: beforeCents, source: "bnhub" as const };

    try {
      await monolithPrisma.$transaction(async (tx) => {
        const u = await tx.shortTermListing.updateMany({
          where: { id: listingId, ownerId: userId },
          data: { nightPriceCents: beforeCents },
        });
        if (u.count === 0) {
          throw new Error("forbidden");
        }
        await tx.aiExecutionLog.create({
          data: {
            listingId,
            action,
            beforeSnapshot: beforeSn,
            afterSnapshot: afterSn,
          },
        });
      });
    } catch (e) {
      if (e instanceof Error && e.message === "forbidden") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      console.error("[ROLLBACK ERROR]", e);
      logError(e, { route: "/api/ai/rollback", phase: "transaction_bnhub" });
      return Response.json({ error: "Rollback failed" }, { status: 500 });
    }

    return Response.json({ ok: true, scope: "bnhub" as const });
  }

  return Response.json({ error: "Unrecognized snapshot" }, { status: 400 });
}
