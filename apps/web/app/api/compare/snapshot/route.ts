import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { welcomeTaxForPriceCents } from "@/lib/compare/welcome-slug";

export const dynamic = "force-dynamic";

/** GET ?ids=id1,id2 — FSBO listing ids */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (ids.length === 0) return NextResponse.json({ listings: [] });

  const rows = await prisma.fsboListing.findMany({
    where: {
      id: { in: ids },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
    },
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const listings = await Promise.all(
    rows.map(async (l) => {
      const wt = await welcomeTaxForPriceCents(prisma, l.city, l.priceCents, "first_time");
      return {
        id: l.id,
        source: "fsbo" as const,
        title: l.title,
        address: l.address,
        city: l.city,
        priceCents: l.priceCents,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        surfaceSqft: l.surfaceSqft,
        propertyType: "FSBO / private sale",
        yearBuilt: null as number | null,
        parking: null as string | null,
        annualTaxesCents: null as number | null,
        condoFeesAnnualCents: null as number | null,
        imageUrl: l.coverImage ?? l.images[0] ?? null,
        href: `/sell/${l.id}`,
        welcomeTaxSlug: wt.slug,
        welcomeTaxCents: wt.welcomeTaxCents,
      };
    })
  );

  return NextResponse.json({ listings });
}
