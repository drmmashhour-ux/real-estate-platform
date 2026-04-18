import { prisma } from "@/lib/db";
import type { MarketplaceAgentKind } from "./agent.types";

export type AgentSubject = { type: "user" | "listing_fsbo" | "listing_bnhub" | "deal"; id: string };

export type LoadedAgentContext = {
  agentKind: MarketplaceAgentKind;
  subject: AgentSubject;
  user?: {
    id: string;
    emailVerified: boolean;
    marketplacePersona: string | null;
    homeCity: string | null;
  };
  fsboListing?: {
    id: string;
    city: string;
    priceCents: number;
    status: string;
    trustScore: number | null;
  };
  bnhubListing?: {
    id: string;
    city: string;
    nightPriceCents: number;
    listingStatus: string;
  };
};

export async function loadAgentContext(
  agentKind: MarketplaceAgentKind,
  subject: AgentSubject,
): Promise<LoadedAgentContext | null> {
  const base: LoadedAgentContext = { agentKind, subject };

  if (subject.type === "user") {
    const u = await prisma.user.findUnique({
      where: { id: subject.id },
      select: {
        id: true,
        emailVerifiedAt: true,
        marketplacePersona: true,
        homeCity: true,
      },
    });
    if (!u) return null;
    base.user = {
      id: u.id,
      emailVerified: !!u.emailVerifiedAt,
      marketplacePersona: u.marketplacePersona,
      homeCity: u.homeCity,
    };
  }

  if (subject.type === "listing_fsbo") {
    const l = await prisma.fsboListing.findUnique({
      where: { id: subject.id },
      select: { id: true, city: true, priceCents: true, status: true, trustScore: true },
    });
    if (!l) return null;
    base.fsboListing = l;
  }

  if (subject.type === "listing_bnhub") {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: subject.id },
      select: { id: true, city: true, nightPriceCents: true, listingStatus: true },
    });
    if (!l) return null;
    base.bnhubListing = {
      id: l.id,
      city: l.city,
      nightPriceCents: l.nightPriceCents,
      listingStatus: l.listingStatus,
    };
  }

  return base;
}
