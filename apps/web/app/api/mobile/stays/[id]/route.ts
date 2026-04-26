import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.shortTermListing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      address: true,
      nightPriceCents: true,
      latitude: true,
      longitude: true,
      listingStatus: true,
    },
  });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    id: row.id,
    title: row.title,
    description: row.description,
    city: row.city,
    address: row.address,
    nightPriceCents: row.nightPriceCents,
    lat: row.latitude,
    lng: row.longitude,
    listingStatus: row.listingStatus,
  });
}
