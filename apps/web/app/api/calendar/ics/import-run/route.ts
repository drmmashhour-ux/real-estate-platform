import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { syncIcsImport } from "@/modules/calendar/ics/ics-sync.service";

export const dynamic = "force-dynamic";

/** POST — trigger one ICS import run (host must own listing). */
export async function POST(req: Request) {
  let parsedImportId = "";

  try {
    const body = (await req.json()) as { importId?: string };
    parsedImportId = typeof body.importId === "string" ? body.importId.trim() : "";

    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!parsedImportId) return NextResponse.json({ error: "importId is required" }, { status: 400 });

    const row = await prisma.listingIcsImport.findUnique({
      where: { id: parsedImportId },
      include: { listing: { select: { ownerId: true } } },
    });
    if (!row || row.listing.ownerId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await syncIcsImport(parsedImportId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ICS import failed";

    await prisma.calendarSyncLog.create({
      data: {
        ...(parsedImportId
          ? {
              importId: parsedImportId,
              listingId:
                (
                  await prisma.listingIcsImport.findUnique({
                    where: { id: parsedImportId },
                    select: { listingId: true },
                  })
                )?.listingId ?? undefined,
            }
          : {}),
        direction: "import",
        status: "failed",
        message,
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
