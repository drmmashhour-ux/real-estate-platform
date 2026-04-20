import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseRemoteIcs } from "./ics-import";

function snapshotRaw(raw: unknown): Prisma.InputJsonValue | undefined {
  try {
    if (raw === undefined || raw === null) return undefined;
    return JSON.parse(JSON.stringify(raw)) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

export async function syncIcsImport(importId: string): Promise<{ success: true; count: number }> {
  const source = await prisma.listingIcsImport.findUnique({
    where: { id: importId },
  });

  if (!source || !source.isEnabled) {
    throw new Error("ICS import source not found or disabled");
  }

  const events = await parseRemoteIcs(source.icsUrl);

  const existing = await prisma.externalCalendarEvent.findMany({
    where: { importId: source.id },
  });

  const existingByUid = new Map(existing.map((e) => [e.externalUid, e]));

  const seenUids = new Set<string>();

  for (const event of events) {
    seenUids.add(event.uid);
    const found = existingByUid.get(event.uid);

    if (found) {
      await prisma.externalCalendarEvent.update({
        where: { id: found.id },
        data: {
          title: event.title,
          startDate: event.start,
          endDate: event.end,
          status: "blocked",
          sourceName: source.sourceName,
          rawData: snapshotRaw(event.raw),
        },
      });
    } else {
      await prisma.externalCalendarEvent.create({
        data: {
          listingId: source.listingId,
          importId: source.id,
          externalUid: event.uid,
          title: event.title,
          startDate: event.start,
          endDate: event.end,
          status: "blocked",
          sourceName: source.sourceName,
          rawData: snapshotRaw(event.raw),
        },
      });
    }
  }

  if (seenUids.size > 0) {
    await prisma.externalCalendarEvent.deleteMany({
      where: {
        importId: source.id,
        externalUid: { notIn: [...seenUids] },
      },
    });
  } else {
    await prisma.externalCalendarEvent.deleteMany({
      where: { importId: source.id },
    });
  }

  await prisma.listingIcsImport.update({
    where: { id: source.id },
    data: {
      lastSyncedAt: new Date(),
    },
  });

  await prisma.calendarSyncLog.create({
    data: {
      listingId: source.listingId,
      importId: source.id,
      direction: "import",
      status: "success",
      message: `Imported ${events.length} ICS events`,
      meta: { count: events.length, sourceName: source.sourceName },
    },
  });

  return { success: true, count: events.length };
}
