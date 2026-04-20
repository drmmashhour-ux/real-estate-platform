import { prisma } from "@/lib/db";

export type PricingApplyActor = "cron_auto" | "host_ui";

function roundCentsFromDollars(d: number): number {
  return Math.max(0, Math.round(d * 100));
}

function pctDiff(a: number, b: number): number {
  if (b <= 0) return a > 0 ? 1 : 0;
  return Math.abs(a - b) / b;
}

/**
 * Applies an **approved** nightly suggestion to the listing's published `nightPriceCents`.
 * Always writes an execution log row (success, skipped, or rejected).
 */
export async function applyPricingSuggestion(
  suggestionId: string,
  ctx: { actor: PricingApplyActor; userId?: string }
): Promise<{ ok: boolean; message?: string }> {
  const suggestion = await prisma.bnhubPricingSuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      listing: {
        select: {
          id: true,
          ownerId: true,
          nightPriceCents: true,
          pricingMode: true,
          autoApplyMaxChange: true,
          currency: true,
        },
      },
    },
  });

  if (!suggestion) {
    return { ok: false, message: "Suggestion not found" };
  }

  const { listing } = suggestion;

  if (ctx.userId && listing.ownerId !== ctx.userId) {
    await prisma.bnhubPricingExecutionLog.create({
      data: {
        listingId: listing.id,
        date: suggestion.date,
        oldPrice: listing.nightPriceCents / 100,
        newPrice: suggestion.suggested,
        mode: ctx.actor,
        status: "rejected",
        reason: "Forbidden: not listing owner",
        suggestionId: suggestion.id,
      },
    });
    return { ok: false, message: "Forbidden" };
  }

  if (suggestion.status !== "approved") {
    await prisma.bnhubPricingExecutionLog.create({
      data: {
        listingId: listing.id,
        date: suggestion.date,
        oldPrice: listing.nightPriceCents / 100,
        newPrice: suggestion.suggested,
        mode: ctx.actor,
        status: "rejected",
        reason: `Suggestion status is ${suggestion.status}, expected approved`,
        suggestionId: suggestion.id,
      },
    });
    return { ok: false, message: "Not approved" };
  }

  if (listing.pricingMode === "OFF") {
    await prisma.bnhubPricingExecutionLog.create({
      data: {
        listingId: listing.id,
        date: suggestion.date,
        oldPrice: listing.nightPriceCents / 100,
        newPrice: suggestion.suggested,
        mode: ctx.actor,
        status: "skipped",
        reason: "pricingMode is OFF — published price unchanged",
        suggestionId: suggestion.id,
      },
    });
    return { ok: false, message: "Pricing mode is OFF" };
  }

  const oldDollars = listing.nightPriceCents / 100;
  const newDollars = suggestion.suggested;

  if (ctx.actor === "cron_auto" && listing.pricingMode === "AUTO_APPROVE_SAFE") {
    const max = listing.autoApplyMaxChange;
    if (max != null && oldDollars > 0 && pctDiff(newDollars, oldDollars) > max) {
      await prisma.bnhubPricingExecutionLog.create({
        data: {
          listingId: listing.id,
          date: suggestion.date,
          oldPrice: oldDollars,
          newPrice: newDollars,
          mode: ctx.actor,
          status: "skipped",
          reason: `Auto-apply exceeds autoApplyMaxChange (${(max * 100).toFixed(0)}%)`,
          suggestionId: suggestion.id,
        },
      });
      return { ok: false, message: "Exceeds safe auto-apply bound" };
    }
  }

  const newCents = roundCentsFromDollars(newDollars);

  await prisma.$transaction(async (tx) => {
    await tx.shortTermListing.update({
      where: { id: listing.id },
      data: { nightPriceCents: newCents },
    });

    await tx.bnhubPricingExecutionLog.create({
      data: {
        listingId: listing.id,
        date: suggestion.date,
        oldPrice: oldDollars,
        newPrice: newDollars,
        mode: ctx.actor,
        status: "success",
        reason:
          ctx.actor === "cron_auto"
            ? "Auto-applied approved suggestion (safe execution layer)"
            : "Host applied approved suggestion from dashboard",
        suggestionId: suggestion.id,
      },
    });

    await tx.bnhubPricingSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: "applied",
        appliedAt: new Date(),
      },
    });
  });

  return { ok: true };
}
