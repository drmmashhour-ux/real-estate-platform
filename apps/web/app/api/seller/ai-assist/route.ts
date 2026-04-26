import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { assertSellerListingActivation } from "@/modules/legal/assert-legal";
import { generateText } from "@/lib/ai/writer";
import { isOpenAiConfigured } from "@/lib/ai/openai";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST — lightweight AI-style suggestions for Seller Hub (heuristic; not legal advice).
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { listingId?: unknown; kind?: unknown };
  try {
    body = (await req.json()) as { listingId?: unknown; kind?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const kind =
    body.kind === "price" ||
    body.kind === "description" ||
    body.kind === "completeness" ||
    body.kind === "legal"
      ? body.kind
      : null;
  if (!listingId || !kind) {
    return Response.json({ error: "listingId and kind required" }, { status: 400 });
  }

  const listing = await prisma.fsboListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: {
      title: true,
      description: true,
      priceCents: true,
      city: true,
      address: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      yearBuilt: true,
      propertyType: true,
      cadastreNumber: true,
      sellerDeclarationCompletedAt: true,
      images: true,
    },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (kind === "legal") {
    const legal = await assertSellerListingActivation(userId, listingId);
    return Response.json({
      summary: legal.ok ? "Legal checklist satisfied for activation." : "Required forms or disclosures are incomplete.",
      ok: legal.ok,
      blockingReasons: legal.blockingReasons,
      missingLabels: legal.missing.map((m) => m.label),
    });
  }

  if (kind === "price") {
    const mid = listing.priceCents > 0 ? listing.priceCents : 450_000;
    const low = Math.round(mid * 0.97);
    const high = Math.round(mid * 1.03);
    return Response.json({
      summary:
        "A discreet reference range around your list price—helpful for framing conversations before you weigh recent comparables and professional counsel.",
      bullets: [
        `Indicative band (±3% of your ask): $${(low / 100).toLocaleString("en-CA")} – $${(high / 100).toLocaleString("en-CA")} CAD.`,
        "Refine with closed sales in your immediate area and the property’s current condition and presentation.",
      ],
    });
  }

  if (kind === "description") {
    const price =
      listing.priceCents > 0 ? `$${(listing.priceCents / 100).toLocaleString("en-CA")} CAD` : undefined;
    const features = [
      listing.bedrooms != null && `${listing.bedrooms} bed`,
      listing.bathrooms != null && `${listing.bathrooms} bath`,
      listing.surfaceSqft != null && `${listing.surfaceSqft} sq ft`,
      listing.yearBuilt != null && `built ${listing.yearBuilt}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const location = [listing.address, listing.city].map((s) => s?.trim()).filter(Boolean).join(", ");
    const listingContext = {
      propertyType: listing.propertyType?.replace(/_/g, " ") || undefined,
      location: location || listing.city || undefined,
      price,
      features: features || undefined,
    };
    const titleLine = listing.title?.trim() ? `Listing title: ${listing.title.trim()}` : "";
    const extra =
      listing.description?.trim().length > 0
        ? `Seller notes / existing draft (improve and polish, keep facts accurate):\n${listing.description.trim()}`
        : "Generate from structured facts — no extra notes.";
    const prompt = [titleLine, extra].filter(Boolean).join("\n\n");

    if (isOpenAiConfigured()) {
      try {
        const text = await generateText(prompt, "listing", { action: "generate", listingContext });
        if (text.trim().length > 40) {
          return Response.json({
            summary:
              "Your description has been refreshed from your saved listing. Review every sentence—it is the market’s first impression of your home.",
            suggestedDescription: text.trim(),
          });
        }
      } catch (e) {
        logError("POST /api/seller/ai-assist description generateText", e);
      }
    }

    const snippet = `${listing.title}. Bright, well-maintained home in ${listing.city}. Contact for showings.`;
    return Response.json({
      summary:
        "We’ve drafted opening language aligned with your listing. Elevate it with your voice and verify every fact before going live.",
      suggestedDescription: listing.description?.length > 80 ? listing.description : snippet,
    });
  }

  const complete: string[] = [];
  const missing: string[] = [];
  if (!listing.cadastreNumber?.trim()) missing.push("cadastre");
  if (!listing.sellerDeclarationCompletedAt) missing.push("seller declaration");
  if (!listing.images?.length) missing.push("photos");
  else complete.push("photos uploaded");

  return Response.json({
    summary: missing.length
      ? "A distinguished listing leaves nothing overlooked. The following touches will elevate your presentation."
      : "Your essentials are in place. A final review of polish and disclosure will match the calibre of your offering.",
    complete,
    missing,
  });
}
