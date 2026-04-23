import { prisma } from "@/lib/db";

import type {
  ListingAssistantContentSnapshot,
  ListingAssistantVersionPhase,
  ListingContentDiffSegment,
  ListingVersionCompareResult,
  SerializedListingAssistantVersion,
} from "@/modules/listing-assistant/listing-version.types";

function normalizeSnapshot(raw: unknown): ListingAssistantContentSnapshot {
  const o = raw as Record<string, unknown>;
  return {
    title: typeof o.title === "string" ? o.title : "",
    description: typeof o.description === "string" ? o.description : "",
    propertyHighlights: Array.isArray(o.propertyHighlights) ? (o.propertyHighlights as string[]) : [],
    language: (o.language === "fr" || o.language === "ar" ? o.language : "en") as ListingAssistantContentSnapshot["language"],
    amenities: Array.isArray(o.amenities) ? (o.amenities as string[]) : undefined,
    zoningNotes: typeof o.zoningNotes === "string" ? o.zoningNotes : undefined,
  };
}

/** Capture CRM title (and optional notes from broker) as immutable baseline when assistant is first used. */
export async function ensureOriginalVersionRecord(params: {
  listingId: string;
  actorUserId: string | null;
}): Promise<void> {
  const existing = await prisma.listingAssistantContentVersion.findFirst({
    where: { listingId: params.listingId, phase: "ORIGINAL" },
    select: { id: true },
  });
  if (existing) return;

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    select: { title: true, titleFr: true, titleAr: true },
  });
  if (!listing) return;

  const snapshot: ListingAssistantContentSnapshot = {
    title: listing.title,
    description: "",
    propertyHighlights: [],
    language: "en",
  };

  await prisma.listingAssistantContentVersion.create({
    data: {
      listingId: params.listingId,
      phase: "ORIGINAL",
      content: snapshot as object,
      source: "SYSTEM",
      actorUserId: params.actorUserId,
    },
  });
}

export async function recordListingAssistantVersion(params: {
  listingId: string;
  phase: ListingAssistantVersionPhase;
  content: ListingAssistantContentSnapshot;
  source: "AI_ASSISTANT" | "BROKER_MANUAL" | "SYSTEM";
  actorUserId: string | null;
}): Promise<SerializedListingAssistantVersion> {
  const row = await prisma.listingAssistantContentVersion.create({
    data: {
      listingId: params.listingId,
      phase: params.phase,
      content: params.content as object,
      source: params.source,
      actorUserId: params.actorUserId,
    },
  });
  return {
    id: row.id,
    listingId: row.listingId,
    phase: row.phase as ListingAssistantVersionPhase,
    source: row.source as SerializedListingAssistantVersion["source"],
    content: normalizeSnapshot(row.content),
    actorUserId: row.actorUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listListingAssistantVersions(
  listingId: string,
  take = 40
): Promise<SerializedListingAssistantVersion[]> {
  const rows = await prisma.listingAssistantContentVersion.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 100),
  });
  return rows.map((row) => ({
    id: row.id,
    listingId: row.listingId,
    phase: row.phase as ListingAssistantVersionPhase,
    source: row.source as SerializedListingAssistantVersion["source"],
    content: normalizeSnapshot(row.content),
    actorUserId: row.actorUserId,
    createdAt: row.createdAt.toISOString(),
  }));
}

function hashSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const shorter = Math.min(a.length, b.length);
  const longer = Math.max(a.length, b.length);
  if (longer === 0) return 1;
  let same = 0;
  const lim = Math.min(a.length, b.length);
  for (let i = 0; i < lim; i++) {
    if (a[i] === b[i]) same++;
  }
  return same / longer;
}

function highlightDiff(a: string[], b: string[]): ListingContentDiffSegment {
  const setA = new Set(a);
  const setB = new Set(b);
  const added = b.filter((x) => !setA.has(x)).length;
  const removed = a.filter((x) => !setB.has(x)).length;
  const changed = added + removed;
  return {
    field: "highlights",
    kind: changed === 0 ? "unchanged" : "changed",
    summary:
      changed === 0 ? "Highlights unchanged"
      : `${added} added / ${removed} removed bullet(s) vs baseline`,
  };
}

/**
 * Lightweight semantic diff for broker review — not a legal redline engine.
 */
export function compareListingContentSnapshots(params: {
  from: ListingAssistantContentSnapshot;
  to: ListingAssistantContentSnapshot;
  fromLabel?: string;
  toLabel?: string;
}): ListingVersionCompareResult {
  const fromLabel = params.fromLabel ?? "From";
  const toLabel = params.toLabel ?? "To";
  const segments: ListingContentDiffSegment[] = [];

  if (params.from.title !== params.to.title) {
    segments.push({
      field: "title",
      kind: "changed",
      summary: `Title updated (${params.from.title.slice(0, 48)}… → ${params.to.title.slice(0, 48)}…)`,
    });
  } else {
    segments.push({ field: "title", kind: "unchanged", summary: "Title unchanged" });
  }

  const descSim = hashSimilarity(params.from.description, params.to.description);
  if (descSim >= 0.995) {
    segments.push({ field: "description", kind: "unchanged", summary: "Description substantially the same" });
  } else {
    const la = params.from.description.split(/\n+/).length;
    const lb = params.to.description.split(/\n+/).length;
    segments.push({
      field: "description",
      kind: "changed",
      summary: "Description edited",
      linesChangedEstimate: Math.abs(lb - la) + Math.round((1 - descSim) * 20),
    });
  }

  segments.push(highlightDiff(params.from.propertyHighlights, params.to.propertyHighlights));

  const mag =
    segments.filter((s) => s.kind !== "unchanged").length === 0 ? 0
    : 1 - (segments.filter((s) => s.kind === "unchanged").length / segments.length);

  return {
    fromLabel,
    toLabel,
    segments,
    changeMagnitude: Math.min(1, Math.max(0, mag)),
  };
}
