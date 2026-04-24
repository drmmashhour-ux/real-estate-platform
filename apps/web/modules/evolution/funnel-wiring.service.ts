import { prisma } from "@/lib/db";
import { recordEvolutionOutcome } from "./outcome-tracker.service";
import { logEvolution } from "./evolution-logger";

/**
 * Funnel Wiring: Track Search -> Click -> Booking conversion.
 */

export async function recordSearchToClick(userId: string, listingId: string, searchMetadata: any) {
  try {
    // Record the "Click" as a high-intent event
    await recordEvolutionOutcome({
      domain: "BNHUB",
      metricType: "CONVERSION",
      strategyKey: "search_click",
      entityId: `${userId}:${listingId}`,
      entityType: "SearchFunnel",
      expectedJson: { conversion: 1 },
      actualJson: { 
        userId, 
        listingId, 
        ...searchMetadata,
        status: "PENDING_BOOKING"
      },
      reinforceStrategy: false,
      idempotent: true,
      duplicateKey: `click:${userId}:${listingId}:${new Date().toISOString().slice(0, 10)}`, // Once per day
    });

    logEvolution("outcome", { event: "outcome_auto_recorded", funnel: "search_click", userId, listingId });
  } catch (err) {
    console.error("[evolution:funnel] failed to record search click", err);
  }
}

/**
 * When a booking is confirmed, check for a preceding click to close the funnel.
 */
export async function wireBookingToFunnel(userId: string, listingId: string, bookingId: string) {
  try {
    // Look for a pending click outcome recorded in the last 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingClick = await prisma.evolutionOutcomeEvent.findFirst({
      where: {
        domain: "BNHUB",
        metricType: "CONVERSION",
        strategyKey: "search_click",
        entityId: `${userId}:${listingId}`,
        createdAt: { gte: cutoff },
        actualJson: { path: ["status"], equals: "PENDING_BOOKING" }
      },
      orderBy: { createdAt: "desc" }
    });

    if (pendingClick) {
      // Mark it as successful
      await recordEvolutionOutcome({
        domain: "BNHUB",
        metricType: "CONVERSION",
        strategyKey: "click_to_booking",
        entityId: bookingId,
        entityType: "Booking",
        expected: 1,
        actual: 1,
        actualJson: {
          userId,
          listingId,
          bookingId,
          clickEventId: pendingClick.id
        },
        reinforceStrategy: true,
        idempotent: true,
        duplicateKey: `funnel_success:${bookingId}`
      });
      
      logEvolution("outcome", { event: "outcome_auto_recorded", funnel: "click_to_booking", bookingId });
    }
  } catch (err) {
    console.error("[evolution:funnel] failed to wire booking to funnel", err);
  }
}

/**
 * Step 3: Pricing Outcome Hook - Detailed Comparison.
 */
export async function recordPricingOutcome(listingId: string, bookingId: string, actualPriceCents: number) {
  try {
    const lastPricing = await prisma.bnhubPricingExecutionLog.findFirst({
      where: { listingId, status: "success" },
      orderBy: { createdAt: "desc" },
    });

    if (lastPricing) {
      await recordEvolutionOutcome({
        domain: "BNHUB",
        metricType: "PRICING",
        strategyKey: "dynamic_pricing",
        entityId: bookingId,
        entityType: "Booking",
        expected: lastPricing.newPrice / 100, // Expected nightly price in dollars
        actual: actualPriceCents / 100,
        actualJson: {
          listingId,
          bookingId,
          suggestedPrice: lastPricing.newPrice,
          actualPrice: actualPriceCents,
          occupancyImpact: "POS_IMPACT", // Simplified
        },
        reinforceStrategy: true,
        idempotent: true,
        duplicateKey: `pricing_outcome:${bookingId}`
      });
      
      logEvolution("outcome", { event: "outcome_auto_recorded", context: "pricing", bookingId });
    }
  } catch (err) {
    console.error("[evolution:pricing] failed to record pricing outcome", err);
  }
}

/**
 * Step 4: Message -> Deal Outcome (Broker Flow).
 */
export async function wireMessageToDeal(conversationId: string, dealId: string | null, status: "DEAL_CREATED" | "LOST") {
  try {
    const conv = await prisma.growthAiConversation.findUnique({
      where: { id: conversationId },
      select: { recommendedTemplateKey: true, learningFlag: true }
    });

    await recordEvolutionOutcome({
      domain: "MESSAGING",
      metricType: "CONVERSION",
      strategyKey: conv?.learningFlag || conv?.recommendedTemplateKey || "response_strategy",
      entityId: conversationId,
      entityType: "GrowthAiConversation",
      expected: 1,
      actual: status === "DEAL_CREATED" ? 1 : 0,
      actualJson: {
        conversationId,
        dealId,
        status,
        templateKey: conv?.recommendedTemplateKey
      },
      reinforceStrategy: true,
      idempotent: true,
      duplicateKey: `msg_to_deal:${conversationId}:${dealId || "lost"}`
    });

    logEvolution("outcome", { event: "outcome_auto_recorded", context: "messaging_deal", conversationId, status });
  } catch (err) {
    console.error("[evolution:messaging] failed to wire message to deal", err);
  }
}

/**
 * Periodically check for clicks that didn't lead to a booking within 24h.
 */
export async function markStaleFunnelOutcomes(limit = 100) {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find "PENDING_BOOKING" clicks older than 24h that haven't been resolved
    const staleClicks = await prisma.evolutionOutcomeEvent.findMany({
      where: {
        domain: "BNHUB",
        metricType: "CONVERSION",
        strategyKey: "search_click",
        createdAt: { lt: cutoff },
        actualJson: { path: ["status"], equals: "PENDING_BOOKING" }
      },
      take: limit
    });

    let count = 0;
    for (const click of staleClicks) {
      // Check if a conversion already exists for this click (paranoia)
      const userIdListingId = click.entityId;
      if (!userIdListingId) continue;
      
      const [userId, listingId] = userIdListingId.split(":");
      
      // Update the click outcome to mark it as STALE/FAILED
      await prisma.evolutionOutcomeEvent.update({
        where: { id: click.id },
        data: {
          actualJson: {
            ...(click.actualJson as object),
            status: "STALE_NO_BOOKING"
          },
          varianceScore: -1 // Negative outcome
        }
      });

      // Record a negative conversion outcome
      await recordEvolutionOutcome({
        domain: "BNHUB",
        metricType: "CONVERSION",
        strategyKey: "click_to_booking",
        entityId: click.entityId,
        entityType: "SearchFunnel",
        expected: 1,
        actual: 0,
        actualJson: {
          reason: "stale_timeout_24h",
          clickEventId: click.id
        },
        reinforceStrategy: true,
        idempotent: true,
        duplicateKey: `funnel_timeout:${click.id}`
      });
      
      count++;
    }

    if (count > 0) {
      logEvolution("outcome", { event: "outcome_auto_recorded", context: "funnel_timeout", count });
    }
    
    return count;
  } catch (err) {
    console.error("[evolution:funnel] failed to mark stale funnel outcomes", err);
    return 0;
  }
}
