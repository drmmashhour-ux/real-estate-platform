import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.bnhubSupabaseGuestFavorite.findMany({
    where: { guestUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { supabaseListingId: true, createdAt: true },
  });

  return Response.json({
    favorites: rows.map((r) => ({
      listingId: r.supabaseListingId,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { listingId?: unknown };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  await prisma.bnhubSupabaseGuestFavorite.upsert({
    where: {
      guestUserId_supabaseListingId: { guestUserId: user.id, supabaseListingId: listingId },
    },
    create: { guestUserId: user.id, supabaseListingId: listingId },
    update: {},
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

  await prisma.bnhubSupabaseGuestFavorite.deleteMany({
    where: { guestUserId: user.id, supabaseListingId: listingId },
  });

  return Response.json({ ok: true });
}
