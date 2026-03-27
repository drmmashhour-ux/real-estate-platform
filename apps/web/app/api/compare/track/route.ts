import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const eventType = String(body.eventType ?? "view");
  const mode = body.mode != null ? String(body.mode) : null;
  const listingIds = Array.isArray(body.listingIds) ? body.listingIds.map(String) : [];
  const userId = await getGuestId();

  await prisma.toolUsageEvent.create({
    data: {
      toolKey: "property_compare",
      eventType,
      userId: userId ?? undefined,
      payloadJson: {
        mode,
        listingIds,
        listingCount: listingIds.length,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
