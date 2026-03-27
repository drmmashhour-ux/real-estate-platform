import { ImmoContactEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { StandardImmoMetadata } from "@/modules/legal/immo-contact-policy";
import { buildImmoContactMetadata } from "@/modules/legal/immo-contact-policy";

export type ImmoContactLogInput = {
  userId?: string | null;
  /** Counterparty user (e.g. host, seller). */
  targetUserId?: string | null;
  brokerId?: string | null;
  /** Denormalized hub surface — defaults from `policy.sourceHub` when omitted. */
  hub?: string | null;
  listingId?: string | null;
  listingKind?: string | null;
  contactType: ImmoContactEventType;
  /** Event instant (UTC). Defaults to now; use for backfills or server-replayed times. */
  actionAt?: Date;
  metadata?: Record<string, unknown>;
  /** When set, merges policy fields (sourceHub, channel, etc.) into metadata. */
  policy?: StandardImmoMetadata;
};

/**
 * Append-only compliance log — views, contact taps, messages, calls, booking requests.
 * Never throws (audit must not break primary flows).
 */
export async function logImmoContactEvent(input: ImmoContactLogInput): Promise<void> {
  try {
    const meta =
      input.policy != null
        ? buildImmoContactMetadata(input.metadata, input.policy)
        : input.metadata;
    const at = input.actionAt ?? new Date();
    const hub =
      (input.hub && input.hub.trim()) ||
      (input.policy?.sourceHub ? String(input.policy.sourceHub) : undefined);
    await prisma.immoContactLog.create({
      data: {
        userId: input.userId ?? undefined,
        targetUserId: input.targetUserId ?? undefined,
        brokerId: input.brokerId ?? undefined,
        hub: hub ? hub.slice(0, 32) : undefined,
        listingId: input.listingId ?? undefined,
        listingKind: input.listingKind ? input.listingKind.slice(0, 48) : undefined,
        contactType: input.contactType,
        metadata: meta ? (meta as object) : undefined,
        actionAt: at,
        createdAt: at,
      },
    });
  } catch (e) {
    console.warn("[immo-contact-log]", e);
  }
}
