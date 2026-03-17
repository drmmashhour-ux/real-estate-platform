import { NextRequest } from "next/server";
import { getAvailability, setAvailability } from "@/lib/bnhub/listings";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (!listingId || !start || !end) {
      return Response.json(
        { error: "listingId, start, end required" },
        { status: 400 }
      );
    }
    const slots = await getAvailability(
      listingId,
      new Date(start),
      new Date(end)
    );
    return Response.json(slots);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

/** POST — Single date: { listingId, date, available?, priceOverrideCents? } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const listingId = body?.listingId;
    const dateStr = body?.date;
    const available = body?.available !== false;
    const priceOverrideCents = body?.priceOverrideCents;
    if (!listingId || !dateStr) {
      return Response.json(
        { error: "listingId and date required" },
        { status: 400 }
      );
    }
    const dateOnly = new Date(dateStr);
    dateOnly.setUTCHours(0, 0, 0, 0);
    await prisma.availabilitySlot.upsert({
      where: { listingId_date: { listingId, date: dateOnly } },
      create: {
        listingId,
        date: dateOnly,
        available,
        priceOverrideCents: priceOverrideCents != null ? Number(priceOverrideCents) : undefined,
      },
      update: {
        available,
        ...(priceOverrideCents !== undefined && { priceOverrideCents: priceOverrideCents == null ? null : Number(priceOverrideCents) }),
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update availability" }, { status: 500 });
  }
}

/** PUT — Bulk calendar: { listingId, slots: [{ date, available?, priceOverrideCents? }] } */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const listingId = body?.listingId;
    const slots = Array.isArray(body?.slots) ? body.slots : [];
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    for (const s of slots) {
      const dateStr = s?.date;
      if (!dateStr) continue;
      const dateOnly = new Date(dateStr);
      dateOnly.setUTCHours(0, 0, 0, 0);
      await prisma.availabilitySlot.upsert({
        where: { listingId_date: { listingId, date: dateOnly } },
        create: {
          listingId,
          date: dateOnly,
          available: s.available !== false,
          priceOverrideCents: s.priceOverrideCents != null ? Number(s.priceOverrideCents) : undefined,
        },
        update: {
          available: s.available !== false,
          ...(s.priceOverrideCents !== undefined && {
            priceOverrideCents: s.priceOverrideCents == null ? null : Number(s.priceOverrideCents),
          }),
        },
      });
    }
    return Response.json({ ok: true, updated: slots.length });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update calendar" }, { status: 500 });
  }
}
