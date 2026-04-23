import { NextRequest } from "next/server";
import { BnhubDayAvailabilityStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { loadStayListingForEditor } from "@/lib/admin/stay-listing-edit";
import { getAvailability } from "@/lib/bnhub/listings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const startRaw = req.nextUrl.searchParams.get("start");
  const endRaw = req.nextUrl.searchParams.get("end");
  const start = startRaw ? new Date(startRaw) : new Date();
  const end = endRaw ? new Date(endRaw) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Response.json({ error: "Invalid start/end" }, { status: 400 });
  }
  const slots = await getAvailability(id, start, end);
  return Response.json({ slots });
}

/**
 * POST { entries: { date: string (ISO day), priceOverrideCents?: number | null, available?: boolean }[] }
 * Bulk upsert calendar rows (Airbnb-style nightly overrides).
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  let body: { entries?: unknown };
  try {
    body = (await req.json()) as { entries?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const entries = Array.isArray(body.entries) ? body.entries : [];
  let n = 0;
  for (const e of entries) {
    if (!e || typeof e !== "object") continue;
    const date = new Date(String((e as { date?: string }).date ?? ""));
    if (Number.isNaN(date.getTime())) continue;
    date.setUTCHours(0, 0, 0, 0);
    const available = (e as { available?: boolean }).available;
    const priceOverrideCents = (e as { priceOverrideCents?: number | null }).priceOverrideCents;
    const dayStatus =
      available === false
        ? BnhubDayAvailabilityStatus.BLOCKED
        : BnhubDayAvailabilityStatus.AVAILABLE;
    await prisma.availabilitySlot.upsert({
      where: { listingId_date: { listingId: id, date } },
      create: {
        listingId: id,
        date,
        available: available !== false,
        dayStatus,
        priceOverrideCents:
          priceOverrideCents != null && Number.isFinite(Number(priceOverrideCents))
            ? Math.round(Number(priceOverrideCents))
            : null,
        bookedByBookingId: null,
      },
      update: {
        available: available !== false,
        dayStatus,
        priceOverrideCents:
          priceOverrideCents != null && Number.isFinite(Number(priceOverrideCents))
            ? Math.round(Number(priceOverrideCents))
            : null,
      },
    });
    n += 1;
  }
  return Response.json({ ok: true, upserted: n });
}
