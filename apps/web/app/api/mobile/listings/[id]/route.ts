import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      address: true,
      priceCents: true,
      coverImage: true,
      images: true,
      bedrooms: true,
      bathrooms: true,
      status: true,
    },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({
    id: row.id,
    title: row.title,
    description: row.description,
    city: row.city,
    address: row.address,
    priceCents: row.priceCents,
    imageUrl: row.coverImage ?? row.images[0] ?? null,
    gallery: row.images,
    beds: row.bedrooms,
    baths: row.bathrooms,
    status: row.status,
  });
}
