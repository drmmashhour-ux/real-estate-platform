/**
 * BNHUB Concierge AI — mock / deterministic / provider-ready.
 * Does not promise third-party fulfillment; recommendations are informational.
 */
import type { BnhubConciergeAiMode, BnhubConciergeRoleContext } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { listPublicServicesForListing } from "./hospitalityServiceCatalogService";
import { getEligibleBundlesForListingOrReservation } from "./bundleService";
import { logHospitalityAction } from "./hospitalityAuditService";

export async function createConciergeSession(args: {
  userId: string;
  bookingId?: string | null;
  listingId?: string | null;
  roleContext: BnhubConciergeRoleContext;
  aiMode?: BnhubConciergeAiMode;
}) {
  return prisma.bnhubConciergeSession.create({
    data: {
      id: randomUUID(),
      userId: args.userId,
      bookingId: args.bookingId ?? undefined,
      listingId: args.listingId ?? undefined,
      roleContext: args.roleContext,
      aiMode: args.aiMode ?? "MOCK",
    },
  });
}

export async function sendMessageToConcierge(args: {
  sessionId: string;
  userId: string;
  text: string;
}) {
  await prisma.bnhubConciergeMessage.create({
    data: {
      id: randomUUID(),
      sessionId: args.sessionId,
      senderType: "USER",
      senderId: args.userId,
      messageText: args.text,
      messageType: "TEXT",
    },
  });
  const reply = await generateGuestRecommendations({
    sessionId: args.sessionId,
    userMessage: args.text,
  });
  return reply;
}

export async function generateGuestRecommendations(args: { sessionId: string; userMessage: string }) {
  const session = await prisma.bnhubConciergeSession.findUniqueOrThrow({
    where: { id: args.sessionId },
  });
  const listingId = session.listingId;
  let available: { name: string; serviceCode: string }[] = [];
  let bundles: { name: string; bundleCode: string }[] = [];
  if (listingId) {
    const offers = await listPublicServicesForListing(listingId);
    available = offers.map((o) => ({ name: o.name, serviceCode: o.serviceCode }));
    const bs = await getEligibleBundlesForListingOrReservation({ listingId, userId: session.userId });
    bundles = bs.map((b) => ({ name: b.name, bundleCode: b.bundleCode }));
  }

  const textFr =
    `Réponse (IA) — informatif seulement; rien n'est garanti par BNHUB.\n` +
    `Services disponibles pour ce séjour: ${available.map((s) => s.name).join(", ") || "aucun configuré"}.\n` +
    `Forfaits: ${bundles.map((b) => b.name).join(", ") || "aucun"}.\n` +
    `Demande: ${args.userMessage.slice(0, 200)}`;

  const textEn =
    `AI reply — informational only; BNHUB does not guarantee third-party services.\n` +
    `Available add-ons: ${available.map((s) => s.name).join(", ") || "none configured"}.\n` +
    `Bundles: ${bundles.map((b) => b.name).join(", ") || "none"}.\n` +
    `Your note: ${args.userMessage.slice(0, 200)}`;

  const msg = await prisma.bnhubConciergeMessage.create({
    data: {
      sessionId: args.sessionId,
      senderType: "AI",
      messageText: `${textEn}\n\n---\n\n${textFr}`,
      messageType: "RECOMMENDATION",
      metadataJson: { available, bundles, locales: ["en", "fr"] },
    },
  });
  await logHospitalityAction({
    actorType: "AI",
    actorId: null,
    entityType: "BnhubConciergeSession",
    entityId: args.sessionId,
    actionType: "recommendation",
    actionSummary: "Generated guest recommendations",
  });
  return msg;
}

export async function generateHostSuggestions(listingId: string) {
  const offers = await listPublicServicesForListing(listingId);
  return {
    message:
      "Consider enabling breakfast and cleaning for higher attach rate. BNHUB does not guarantee guest uptake.",
    enabledCount: offers.length,
  };
}

export const suggestBundles = getEligibleBundlesForListingOrReservation;
export const suggestServicesForStay = listPublicServicesForListing;

export async function suggestUpsells(listingId: string) {
  return suggestServicesForStay(listingId);
}

export async function escalateToHumanIfNeeded(sessionId: string, reason: string) {
  await prisma.bnhubConciergeSession.update({
    where: { id: sessionId },
    data: { sessionStatus: "ESCALATED", summary: reason },
  });
  await prisma.bnhubConciergeMessage.create({
    data: {
      sessionId,
      senderType: "AI",
      messageText: `Escalated: ${reason}`,
      messageType: "ESCALATION_NOTE",
    },
  });
}

export async function summarizeSession(sessionId: string) {
  const msgs = await prisma.bnhubConciergeMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  const summary = msgs.map((m) => `${m.senderType}: ${m.messageText.slice(0, 120)}`).join("\n");
  await prisma.bnhubConciergeSession.update({
    where: { id: sessionId },
    data: { summary, sessionStatus: "CLOSED" },
  });
  return summary;
}
