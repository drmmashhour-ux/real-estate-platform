import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { assertSellerListingActivation } from "@/modules/legal/assert-legal";

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
      bedrooms: true,
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
      summary: "Heuristic price band (not an appraisal).",
      bullets: [
        `Comparable band (±3% around your ask): $${(low / 100).toLocaleString()} – $${(high / 100).toLocaleString()} CAD.`,
        "Refine using recent sales in your neighbourhood and property condition.",
      ],
    });
  }

  if (kind === "description") {
    const snippet = `${listing.title}. Bright, well-maintained home in ${listing.city}. Contact for showings.`;
    return Response.json({
      summary: "Draft description idea — edit to match your property.",
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
    summary: missing.length ? "Some checklist items remain." : "Core listing fields look filled in.",
    complete,
    missing,
  });
}
