/**
 * Global Property Data Graph – query layer.
 * Assembles graph nodes and edges from relational data and PropertyGraphEdge table.
 */

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { GraphNode, GraphEdge, PropertyGraphView, PropertyHistoryEntry } from "./types";
import type { NodeType, EdgeType } from "./types";

function node(id: string, type: NodeType, data: Record<string, unknown>, createdAt?: Date): GraphNode {
  return {
    id,
    type,
    data,
    createdAt: createdAt?.toISOString(),
  };
}

function edge(
  id: string,
  fromType: NodeType,
  fromId: string,
  toType: NodeType,
  toId: string,
  edgeType: EdgeType,
  metadata?: Record<string, unknown>,
  createdAt?: Date
): GraphEdge {
  return {
    id,
    fromType,
    fromId,
    toType,
    toId,
    edgeType,
    metadata: metadata ?? undefined,
    createdAt: createdAt?.toISOString(),
  };
}

/** Get full graph view for a property identity: nodes and edges derived from DB + semantic edges. */
export async function getPropertyGraph(propertyIdentityId: string): Promise<PropertyGraphView | null> {
  const identity = await prisma.propertyIdentity.findUnique({
    where: { id: propertyIdentityId },
    include: {
      shortTermListings: {
        select: {
          id: true,
          title: true,
          listingStatus: true,
          listingVerificationStatus: true,
          ownerId: true,
          createdAt: true,
          propertyFraudScores: { take: 1, orderBy: { createdAt: "desc" } },
          propertyFraudAlerts: { where: { status: "open" }, take: 5 },
        },
      },
      realEstateTransactions: {
        select: {
          id: true,
          status: true,
          offerPrice: true,
          buyerId: true,
          sellerId: true,
          brokerId: true,
          createdAt: true,
        },
      },
      propertyValuations: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          valuationType: true,
          estimatedValue: true,
          monthlyRentEstimate: true,
          nightlyRateEstimate: true,
          confidenceScore: true,
          confidenceLabel: true,
          createdAt: true,
        },
      },
      owners: { where: { isCurrent: true }, take: 5 },
      events: { take: 20, orderBy: { createdAt: "desc" } },
      riskRecords: { take: 1, orderBy: { lastEvaluatedAt: "desc" } },
      ownershipHistory: {
        take: 20,
        orderBy: { effectiveStartDate: "desc" },
        include: { ownerIdentity: true },
      },
      brokerAuthorizationHistory: {
        take: 20,
        orderBy: { startDate: "desc" },
        include: { brokerIdentity: true },
      },
    },
  });

  if (!identity) return null;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push(
    node(
      identity.id,
      "PROPERTY",
      {
        property_identity_id: identity.id,
        property_uid: identity.propertyUid,
        cadastre_number: identity.cadastreNumber,
        normalized_address: identity.normalizedAddress,
        municipality: identity.municipality,
        province: identity.province,
        country: identity.country,
        property_type: identity.propertyType,
        latitude: identity.latitude,
        longitude: identity.longitude,
        verification_score: identity.verificationScore,
      },
      identity.createdAt
    )
  );

  const userIds = new Set<string>();
  for (const list of identity.shortTermListings) {
    userIds.add(list.ownerId);
    nodes.push(
      node(
        list.id,
        "LISTING",
        {
          listing_id: list.id,
          listing_type: "short_term_rental",
          status: list.listingStatus,
          verification_status: list.listingVerificationStatus,
          title: list.title,
          created_at: list.createdAt,
        },
        list.createdAt
    )
    );
    edges.push(edge(identity.id + "-" + list.id, "PROPERTY", identity.id, "LISTING", list.id, "HAS_LISTING", undefined, list.createdAt));
    edges.push(edge(list.id + "-" + list.ownerId, "LISTING", list.id, "USER", list.ownerId, "CREATED_BY", undefined, list.createdAt));
    userIds.add(list.ownerId);

    if (list.propertyFraudScores[0]) {
      const fs = list.propertyFraudScores[0];
      nodes.push(node(fs.id, "FRAUD_EVENT", { fraud_event_id: fs.id, risk_score: fs.fraudScore, risk_level: fs.riskLevel }, fs.createdAt));
      edges.push(edge(fs.id + "-list", "LISTING", list.id, "FRAUD_EVENT", fs.id, "HAS_FRAUD_EVENT"));
    }
    for (const fa of list.propertyFraudAlerts) {
      nodes.push(
        node(fa.id, "FRAUD_EVENT", {
          fraud_event_id: fa.id,
          alert_type: fa.alertType,
          severity: fa.severity,
          message: fa.message,
          status: fa.status,
        }, fa.createdAt)
      );
      edges.push(edge(fa.id + "-list", "LISTING", list.id, "FRAUD_EVENT", fa.id, "HAS_FRAUD_EVENT"));
    }
  }

  for (const tx of identity.realEstateTransactions) {
    nodes.push(
      node(
        tx.id,
        "TRANSACTION",
        {
          transaction_id: tx.id,
          transaction_status: tx.status,
          offer_price: tx.offerPrice,
          created_at: tx.createdAt,
        },
        tx.createdAt
      )
    );
    edges.push(edge(identity.id + "-" + tx.id, "PROPERTY", identity.id, "TRANSACTION", tx.id, "HAS_TRANSACTION", undefined, tx.createdAt));
    userIds.add(tx.buyerId);
    userIds.add(tx.sellerId);
    if (tx.brokerId) userIds.add(tx.brokerId);
    edges.push(edge(tx.id + "-buyer", "TRANSACTION", tx.id, "USER", tx.buyerId, "BUYER"));
    edges.push(edge(tx.id + "-seller", "TRANSACTION", tx.id, "USER", tx.sellerId, "SELLER"));
    if (tx.brokerId) edges.push(edge(tx.id + "-broker", "TRANSACTION", tx.id, "USER", tx.brokerId, "BROKER"));
  }

  for (const val of identity.propertyValuations) {
    nodes.push(
      node(
        val.id,
        "VALUATION",
        {
          valuation_id: val.id,
          valuation_type: val.valuationType,
          estimated_value: val.estimatedValue,
          monthly_rent_estimate: val.monthlyRentEstimate,
          nightly_rate_estimate: val.nightlyRateEstimate,
          confidence_score: val.confidenceScore,
          confidence_label: val.confidenceLabel,
          created_at: val.createdAt,
        },
        val.createdAt
      )
    );
    edges.push(edge(identity.id + "-" + val.id, "PROPERTY", identity.id, "VALUATION", val.id, "HAS_VALUATION", undefined, val.createdAt));
  }

  const ownerNodeIds = new Set<string>();
  for (const o of identity.owners) {
    nodes.push(
      node(o.id, "OWNER", {
        owner_id: o.id,
        owner_name: o.ownerName,
        source: o.ownerSource,
        is_current: o.isCurrent,
        legacy: true,
      }, o.createdAt)
    );
    edges.push(edge(identity.id + "-" + o.id, "PROPERTY", identity.id, "OWNER", o.id, "OWNED_BY", undefined, o.createdAt));
    ownerNodeIds.add(o.id);
  }
  for (const h of identity.ownershipHistory ?? []) {
    const oi = h.ownerIdentity;
    if (!oi || ownerNodeIds.has(oi.id)) continue;
    ownerNodeIds.add(oi.id);
    nodes.push(
      node(oi.id, "OWNER", {
        owner_identity_id: oi.id,
        legal_name: oi.legalName,
        normalized_name: oi.normalizedName,
        verification_status: oi.verificationStatus,
        source: "identity_network",
      }, h.createdAt)
    );
    edges.push(edge(identity.id + "-" + oi.id, "PROPERTY", identity.id, "OWNER", oi.id, "OWNED_BY", undefined, h.createdAt));
  }
  const brokerNodeIds = new Set<string>();
  for (const h of identity.brokerAuthorizationHistory ?? []) {
    const bi = h.brokerIdentity;
    if (!bi || brokerNodeIds.has(bi.id)) continue;
    brokerNodeIds.add(bi.id);
    nodes.push(
      node(bi.id, "BROKER", {
        broker_identity_id: bi.id,
        legal_name: bi.legalName,
        license_number: bi.licenseNumber,
        brokerage_name: bi.brokerageName,
        verification_status: bi.verificationStatus,
        source: "identity_network",
      }, h.createdAt)
    );
    edges.push(edge(identity.id + "-" + bi.id, "PROPERTY", identity.id, "BROKER", bi.id, "BROKERED_BY", undefined, h.createdAt));
  }

  if (identity.riskRecords[0]) {
    const r = identity.riskRecords[0];
    nodes.push(
      node(r.id, "FRAUD_EVENT", {
        fraud_event_id: r.id,
        risk_score: r.riskScore,
        risk_level: r.riskLevel,
        last_evaluated_at: r.lastEvaluatedAt,
      }, r.createdAt)
    );
    edges.push(edge(identity.id + "-" + r.id, "PROPERTY", identity.id, "FRAUD_EVENT", r.id, "HAS_FRAUD_EVENT"));
  }

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, email: true, accountStatus: true, createdAt: true },
  });
  for (const u of users) {
    nodes.push(
      node(u.id, "USER", {
        user_id: u.id,
        name: u.name,
        email: u.email,
        account_status: u.accountStatus,
      }, u.createdAt)
    );
  }

  const semanticEdges = await prisma.propertyGraphEdge.findMany({
    where: {
      OR: [
        { fromEntityType: "PROPERTY", fromEntityId: identity.id },
        { toEntityType: "PROPERTY", toEntityId: identity.id },
      ],
    },
  });
  for (const e of semanticEdges) {
    edges.push(
      edge(
        e.id,
        e.fromEntityType as NodeType,
        e.fromEntityId,
        e.toEntityType as NodeType,
        e.toEntityId,
        e.edgeType as EdgeType,
        e.metadata as Record<string, unknown> | undefined,
        e.createdAt
      )
    );
  }

  return {
    property: nodes[0]!,
    nodes,
    edges,
  };
}

/** Get lifecycle history for a property (events + listing/transaction/valuation timestamps). */
export async function getPropertyHistory(propertyIdentityId: string): Promise<PropertyHistoryEntry[]> {
  const [events, listings, transactions, valuations] = await Promise.all([
    prisma.propertyIdentityEvent.findMany({
      where: { propertyIdentityId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.shortTermListing.findMany({
      where: { propertyIdentityId },
      select: { id: true, listingStatus: true, listingVerificationStatus: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.realEstateTransaction.findMany({
      where: { propertyIdentityId },
      select: { id: true, status: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.propertyValuation.findMany({
      where: { propertyIdentityId },
      select: { id: true, valuationType: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const out: PropertyHistoryEntry[] = [];
  for (const e of events) {
    out.push({
      eventType: e.eventType,
      at: e.createdAt.toISOString(),
      entityType: "EVENT",
      entityId: e.id,
      data: e.eventData as Record<string, unknown>,
    });
  }
  for (const l of listings) {
    out.push({
      eventType: "listing_created",
      at: l.createdAt.toISOString(),
      entityType: "LISTING",
      entityId: l.id,
      data: { status: l.listingStatus, verification_status: l.listingVerificationStatus },
    });
  }
  for (const t of transactions) {
    out.push({
      eventType: "transaction_created",
      at: t.createdAt.toISOString(),
      entityType: "TRANSACTION",
      entityId: t.id,
      data: { status: t.status },
    });
  }
  for (const v of valuations) {
    out.push({
      eventType: "valuation_created",
      at: v.createdAt.toISOString(),
      entityType: "VALUATION",
      entityId: v.id,
      data: { valuation_type: v.valuationType },
    });
  }
  out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return out.slice(0, 100);
}

/** Get relations summary: owners, listings count, transactions count, valuations count, fraud signals. */
export async function getPropertyRelations(propertyIdentityId: string) {
  const [identity, owners, listings, transactions, valuations, fraudScores, alerts] = await Promise.all([
    prisma.propertyIdentity.findUnique({
      where: { id: propertyIdentityId },
      select: { id: true, propertyUid: true, cadastreNumber: true, normalizedAddress: true, municipality: true, province: true, country: true },
    }),
    prisma.propertyIdentityOwner.findMany({ where: { propertyIdentityId }, orderBy: { createdAt: "desc" } }),
    prisma.shortTermListing.findMany({
      where: { propertyIdentityId },
      select: { id: true, listingStatus: true, ownerId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.realEstateTransaction.findMany({
      where: { propertyIdentityId },
      select: { id: true, status: true, buyerId: true, sellerId: true, brokerId: true },
    }),
    prisma.propertyValuation.findMany({
      where: { propertyIdentityId },
      select: { id: true, valuationType: true, estimatedValue: true, confidenceScore: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.propertyFraudScore.findMany({
      where: { listing: { propertyIdentityId } },
      select: { id: true, fraudScore: true, riskLevel: true, listingId: true },
    }),
    prisma.propertyFraudAlert.findMany({
      where: { listing: { propertyIdentityId }, status: "open" },
      select: { id: true, alertType: true, severity: true, message: true },
    }),
  ]);

  const listingIds = listings.map((l) => l.id);
  const safetyIncidents =
    listingIds.length > 0
      ? await prisma.trustSafetyIncident.findMany({
          where: { listingId: { in: listingIds } },
          select: { id: true, incidentCategory: true, severityLevel: true, status: true },
          take: 20,
        })
      : [];

  return {
    property: identity,
    owners,
    listings,
    transactions,
    valuations,
    fraudScores,
    fraudAlerts: alerts,
    safetyIncidents,
  };
}

/** Get all listings linked to a property identity. */
export async function getPropertyListings(propertyIdentityId: string) {
  return prisma.shortTermListing.findMany({
    where: { propertyIdentityId },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      propertyFraudScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
}

/** Get fraud signals for a property (via its listings and identity risk). */
export async function getPropertyFraudSignals(propertyIdentityId: string) {
  const [listingScores, listingAlerts, identityRisk] = await Promise.all([
    prisma.propertyFraudScore.findMany({
      where: { listing: { propertyIdentityId } },
      include: { listing: { select: { id: true, title: true } } },
    }),
    prisma.propertyFraudAlert.findMany({
      where: { listing: { propertyIdentityId } },
      include: { listing: { select: { id: true, title: true } } },
    }),
    prisma.propertyIdentityRisk.findMany({
      where: { propertyIdentityId },
      orderBy: { lastEvaluatedAt: "desc" },
      take: 5,
    }),
  ]);
  return { listingScores, listingAlerts, identityRisk };
}

/** Get valuations for a property. */
export async function getPropertyValuations(propertyIdentityId: string) {
  return prisma.propertyValuation.findMany({
    where: { propertyIdentityId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Get user network: properties they own/list, listings, bookings, transactions (buyer/seller/broker). */
export async function getUserNetwork(userId: string) {
  const [listings, bookingsAsGuest, transactionsAsBuyer, transactionsAsSeller, transactionsAsBroker] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, listingStatus: true, propertyIdentityId: true },
    }),
    prisma.booking.findMany({
      where: { guestId: userId },
      select: { id: true, status: true, checkIn: true, listingId: true },
      take: 50,
    }),
    prisma.realEstateTransaction.findMany({
      where: { buyerId: userId },
      select: { id: true, status: true, propertyIdentityId: true },
    }),
    prisma.realEstateTransaction.findMany({
      where: { sellerId: userId },
      select: { id: true, status: true, propertyIdentityId: true },
    }),
    prisma.realEstateTransaction.findMany({
      where: { brokerId: userId },
      select: { id: true, status: true, propertyIdentityId: true },
    }),
  ]);
  const propertyIds = new Set<string>();
  for (const l of listings) if (l.propertyIdentityId) propertyIds.add(l.propertyIdentityId);
  for (const t of [...transactionsAsBuyer, ...transactionsAsSeller, ...transactionsAsBroker]) propertyIds.add(t.propertyIdentityId);
  const properties = await prisma.propertyIdentity.findMany({
    where: { id: { in: Array.from(propertyIds) } },
    select: { id: true, propertyUid: true, normalizedAddress: true, municipality: true, province: true },
  });
  return {
    userId,
    listings,
    bookingsAsGuest,
    transactionsAsBuyer,
    transactionsAsSeller,
    transactionsAsBroker,
    properties,
  };
}

/** Get broker network: transactions brokered, listings (if broker-verified users have listings), activity score. */
export async function getBrokerNetwork(brokerId: string) {
  const [transactions, activityScore, brokerVerification] = await Promise.all([
    prisma.realEstateTransaction.findMany({
      where: { brokerId },
      select: { id: true, status: true, propertyIdentityId: true, offerPrice: true },
    }),
    prisma.brokerActivityScore.findUnique({ where: { brokerId } }),
    prisma.brokerVerification.findUnique({ where: { userId: brokerId } }),
  ]);
  const propertyIds = transactions.map((t) => t.propertyIdentityId).filter(Boolean) as string[];
  const properties = await prisma.propertyIdentity.findMany({
    where: { id: { in: propertyIds } },
    select: { id: true, propertyUid: true, normalizedAddress: true },
  });
  return {
    brokerId,
    transactions,
    properties,
    activityScore,
    brokerVerification,
  };
}

/** Get or create market by city/municipality/province/country; return market id and slug. */
export async function getOrCreateMarket(params: { city?: string; municipality?: string; province: string; country?: string }) {
  const slug = [params.city ?? params.municipality ?? "", params.province, params.country ?? "US"].filter(Boolean).join("-").toLowerCase().replace(/\s+/g, "-");
  let market = await prisma.market.findUnique({ where: { slug } });
  if (!market) {
    market = await prisma.market.create({
      data: {
        city: params.city ?? undefined,
        municipality: params.municipality ?? undefined,
        province: params.province,
        country: params.country ?? "US",
        slug,
      },
    });
  }
  return market;
}

/** Get market by id or slug with basic stats. */
export async function getMarket(marketIdOrSlug: string) {
  const market = await prisma.market.findFirst({
    where: { OR: [{ id: marketIdOrSlug }, { slug: marketIdOrSlug }] },
  });
  if (!market) return null;
  const [listingCount, propertyCount] = await Promise.all([
    prisma.shortTermListing.count({
      where: {
        city: market.city ?? undefined,
        province: market.province,
        country: market.country,
        listingStatus: "PUBLISHED",
      },
    }),
    prisma.propertyIdentity.count({
      where: {
        municipality: market.municipality ?? undefined,
        province: market.province,
        country: market.country,
      },
    }),
  ]);
  return { ...market, listingCount, propertyCount };
}

/** Add a semantic graph edge (e.g. SIMILAR_TO, SAME_MARKET). */
export async function addGraphEdge(params: {
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  edgeType: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.propertyGraphEdge.create({
    data: {
      fromEntityType: params.fromEntityType,
      fromEntityId: params.fromEntityId,
      toEntityType: params.toEntityType,
      toEntityId: params.toEntityId,
      edgeType: params.edgeType,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
