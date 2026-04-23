import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { assertListingOwner } from "@/lib/bnhub/hospitality-addons";

export const dynamic = "force-dynamic";

function assertHttpsCalendarUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Invalid ICS URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("ICS URL must start with http or https");
  }
  return raw.trim();
}

/** POST — register external ICS URL for periodic import. */
export async function POST(req: Request) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      listingId?: string;
      sourceName?: string;
      icsUrl?: string;
    };

    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const sourceName = typeof body.sourceName === "string" ? body.sourceName.trim() : "";
    const icsUrlClean = typeof body.icsUrl === "string" ? body.icsUrl.trim() : "";

    if (!listingId || !sourceName || !icsUrlClean) {
      return NextResponse.json({ error: "listingId, sourceName, and icsUrl required" }, { status: 400 });
    }

    const gate = await assertListingOwner(userId, listingId);
    if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

    let icsUrl: string;
    try {
      icsUrl = assertHttpsCalendarUrl(icsUrlClean);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid URL";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const row = await prisma.listingIcsImport.create({
      data: {
        listingId,
        sourceName,
        icsUrl,
      },
    });

    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
