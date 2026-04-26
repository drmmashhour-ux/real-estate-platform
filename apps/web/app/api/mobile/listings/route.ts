import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** Slim FSBO listings for mobile discovery — public read. */
export async function GET() {
  const rows = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: {
      id: true,
      title: true,
      city: true,
      priceCents: true,
      coverImage: true,
      bedrooms: true,
      bathrooms: true,
    },
  });

  return Response.json({
    listings: rows.map((r) => ({
      id: r.id,
      title: r.title,
      city: r.city,
      priceCents: r.priceCents,
      imageUrl: r.coverImage ?? null,
      beds: r.bedrooms,
      baths: r.bathrooms,
    })),
  });
}
