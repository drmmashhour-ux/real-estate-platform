import { NextRequest } from "next/server";
import {
  PRICING_RULE_TYPE_EARLY_BOOKING,
  sanitizeEarlyBookingPayload,
} from "@/lib/bnhub/early-booking-discount";
import { getPricingRulesForListing, upsertPricingRule } from "@/lib/bnhub/pricing";

/** GET: pricing rules for a listing (?listingId=). */
export async function GET(request: NextRequest) {
  try {
    const listingId = request.nextUrl.searchParams.get("listingId");
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    const forDate = request.nextUrl.searchParams.get("forDate") ?? undefined;
    const rules = await getPricingRulesForListing(listingId, forDate);
    return Response.json(rules);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch pricing rules" }, { status: 500 });
  }
}

/** POST: create or update a pricing rule (host). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const listingId = body?.listingId;
    const ruleType = body?.ruleType;
    const payload = body?.payload;
    const validFrom = body?.validFrom ? new Date(body.validFrom) : undefined;
    const validTo = body?.validTo ? new Date(body.validTo) : undefined;
    if (!listingId || !ruleType || typeof payload !== "object") {
      return Response.json({ error: "listingId, ruleType, payload required" }, { status: 400 });
    }
    let safePayload: Record<string, unknown> = payload as Record<string, unknown>;
    if (ruleType === PRICING_RULE_TYPE_EARLY_BOOKING) {
      const p = sanitizeEarlyBookingPayload(safePayload);
      if (!p) {
        return Response.json(
          {
            error:
              "EARLY_BOOKING payload needs minLeadDays (1–365) and discountPercent (1–35)",
          },
          { status: 400 }
        );
      }
      safePayload = p;
    }
    const rule = await upsertPricingRule({
      listingId,
      ruleType,
      payload: safePayload,
      validFrom,
      validTo,
    });
    return Response.json(rule);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to upsert pricing rule" }, { status: 500 });
  }
}
