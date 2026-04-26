import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const DEFAULT_DESIGN_PRICE_CENTS = 500; // $5 per design

/** POST /api/design-studio/save-reference – save design URL reference and attach to listing. Charges $5 per design after trial. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, designUrl, title } = body as {
      listingId?: string;
      designUrl?: string;
      title?: string;
    };
    if (!listingId || !designUrl) {
      return Response.json(
        { error: "listingId and designUrl required" },
        { status: 400 }
      );
    }

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const ref = await prisma.listingDesignReference.create({
      data: {
        listingId,
        source: "canva",
        designUrl: designUrl.slice(0, 2048),
        title: title?.slice(0, 256) ?? null,
      },
    });

    const userId = await getGuestId();
    const priceCents = Math.max(0, Number(process.env.DESIGN_STUDIO_PRICE_CENTS) || DEFAULT_DESIGN_PRICE_CENTS);
    const trialDays = Math.max(0, Number(process.env.DESIGN_STUDIO_TRIAL_DAYS) || 7);
    let chargeCents: number | undefined;
    let trialEndsAt: string | undefined;

    if (userId && priceCents > 0) {
      let trial = await prisma.designStudioTrial.findUnique({ where: { userId } });
      const now = new Date();
      if (!trial) {
        const endsAt = new Date(now);
        endsAt.setDate(endsAt.getDate() + trialDays);
        trial = await prisma.designStudioTrial.create({
          data: { userId, trialEndsAt: endsAt },
        });
      }
      const inTrial = trial.trialEndsAt > now;
      if (inTrial) {
        trialEndsAt = trial.trialEndsAt.toISOString();
      } else {
        await prisma.planBillingEvent.create({
          data: {
            userId,
            eventType: "DESIGN_SAVED",
            amountCents: priceCents,
            metadata: { listingId, designReferenceId: ref.id, source: "design_studio" },
          },
        });
        chargeCents = priceCents;
      }
    }

    return Response.json({
      id: ref.id,
      listingId: ref.listingId,
      designUrl: ref.designUrl,
      title: ref.title,
      createdAt: ref.createdAt,
      chargeCents,
      trialEndsAt,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to save reference" }, { status: 500 });
  }
}
