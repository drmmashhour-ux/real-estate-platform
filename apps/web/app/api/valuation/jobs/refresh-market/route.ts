import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildPropertyInput } from "@/lib/valuation/input";
import { checkValuationGuardrails } from "@/lib/valuation/guardrails";
import { computeSaleValuation } from "@/lib/valuation/sale";
import { computeLongTermRentValuation } from "@/lib/valuation/long-term-rent";
import { saveValuation } from "@/lib/valuation/store";

/**
 * POST /api/valuation/jobs/refresh-market
 * Refresh sale and long-term-rent valuations for recent property identities. Protect with cron secret or admin.
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

    const identities = await prisma.propertyIdentity.findMany({
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    let saleCount = 0;
    let rentCount = 0;
    for (const { id } of identities) {
      const guardrails = await checkValuationGuardrails(id);
      if (!guardrails.allowed) continue;
      const input = await buildPropertyInput(id, null);
      if (!input) continue;
      try {
        const [sale, rent] = await Promise.all([
          computeSaleValuation(input),
          computeLongTermRentValuation(input),
        ]);
        await saveValuation(id, null, "sale", sale);
        await saveValuation(id, null, "long_term_rental", rent);
        saleCount++;
        rentCount++;
      } catch (e) {
        console.warn("Valuation refresh failed for", id, e);
      }
    }

    return Response.json({ refreshed: { sale: saleCount, long_term_rent: rentCount } });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Job failed" },
      { status: 500 }
    );
  }
}
