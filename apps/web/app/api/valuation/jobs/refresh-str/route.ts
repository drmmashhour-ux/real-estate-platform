import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { buildPropertyInput } from "@/lib/valuation/input";
import { checkValuationGuardrails } from "@/lib/valuation/guardrails";
import { computeShortTermRentValuation } from "@/lib/valuation/short-term-rent";
import { saveValuation } from "@/lib/valuation/store";

/**
 * POST /api/valuation/jobs/refresh-str
 * Refresh short-term rental valuations for listings with property identity. Protect with cron secret or admin.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const secret = process.env.CRON_SECRET || process.env.VALUATION_JOB_SECRET;
    if (secret && body.secret !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listings = await prisma.shortTermListing.findMany({
      where: { propertyIdentityId: { not: null }, listingStatus: "PUBLISHED" },
      select: { id: true, propertyIdentityId: true },
      take: 100,
    });

    let count = 0;
    for (const l of listings) {
      const pid = l.propertyIdentityId!;
      const guardrails = await checkValuationGuardrails(pid);
      if (!guardrails.allowed) continue;
      const input = await buildPropertyInput(pid, l.id);
      if (!input) continue;
      try {
        const result = await computeShortTermRentValuation(input, l.id);
        await saveValuation(pid, l.id, "short_term_rental", result);
        count++;
      } catch (e) {
        console.warn("STR valuation refresh failed for listing", l.id, e);
      }
    }

    return Response.json({ refreshed: count });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Job failed" },
      { status: 500 }
    );
  }
}
