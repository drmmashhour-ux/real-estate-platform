import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.bnhubListingPriceWatch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      supabaseListingId: true,
      lastKnownPriceCents: true,
      lastNotifiedAt: true,
      createdAt: true,
    },
  });

  return Response.json({
    watches: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      lastNotifiedAt: r.lastNotifiedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    listingId?: unknown;
    lastKnownPriceCents?: unknown;
  };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const lastKnown =
    body.lastKnownPriceCents != null && Number.isFinite(Number(body.lastKnownPriceCents))
      ? Math.round(Number(body.lastKnownPriceCents))
      : null;

  await prisma.bnhubListingPriceWatch.upsert({
    where: {
      userId_supabaseListingId: { userId: user.id, supabaseListingId: listingId },
    },
    create: {
      userId: user.id,
      supabaseListingId: listingId,
      lastKnownPriceCents: lastKnown,
    },
    update: {
      lastKnownPriceCents: lastKnown ?? undefined,
    },
  });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId")?.trim() ?? "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  await prisma.bnhubListingPriceWatch.deleteMany({
    where: { userId: user.id, supabaseListingId: listingId },
  });

  return Response.json({ ok: true });
}
