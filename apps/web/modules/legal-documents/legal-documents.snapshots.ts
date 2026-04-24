import type { LecipmLegalDocumentTemplateKind } from "@prisma/client";
import { prisma } from "@/lib/db";

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function buildSnapshotForKind(
  kind: LecipmLegalDocumentTemplateKind,
  input: { dealId?: string | null; capitalDealId?: string | null },
): Promise<Record<string, unknown>> {
  const generatedAt = new Date().toISOString();
  const meta = { generatedAt };

  if (
    kind === "PROMISE_TO_PURCHASE" ||
    kind === "COUNTER_PROPOSAL" ||
    kind === "AMENDMENT" ||
    kind === "BROKER_DISCLOSURE" ||
    kind === "CONFLICT_DISCLOSURE" ||
    kind === "DEAL_INVESTOR_HANDOFF_PACKET"
  ) {
    if (!input.dealId) throw new Error("dealId is required for this document kind.");
  }

  if (
    kind === "SUBSCRIPTION_AGREEMENT" ||
    kind === "INVESTOR_MEMO" ||
    kind === "RISK_DISCLOSURE" ||
    kind === "EXEMPTION_REPRESENTATION" ||
    kind === "INVESTOR_QUESTIONNAIRE"
  ) {
    if (!input.capitalDealId) throw new Error("capitalDealId is required for investment-domain documents.");
  }

  if (input.dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: input.dealId },
      include: {
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        broker: {
          select: {
            name: true,
            email: true,
            lecipmBrokerLicenceProfile: {
              select: {
                fullName: true,
                licenceNumber: true,
                regulator: true,
                city: true,
                province: true,
              },
            },
          },
        },
      },
    });
    if (!deal) throw new Error("Deal not found.");

    const listing = deal.listingId
      ? await prisma.listing.findUnique({
          where: { id: deal.listingId },
          select: {
            title: true,
            listingCode: true,
            price: true,
            listingType: true,
            isCoOwnership: true,
          },
        })
      : null;

    const execMeta = deal.executionMetadata as Record<string, unknown> | null;
    const conditionsSummary =
      typeof execMeta?.conditionsSummary === "string"
        ? execMeta.conditionsSummary
        : JSON.stringify(execMeta?.conditions ?? execMeta?.milestones ?? {});

    const brokerProfile = deal.broker?.lecipmBrokerLicenceProfile;
    const broker = {
      displayName: brokerProfile?.fullName ?? deal.broker?.name ?? "",
      licenceNumber: brokerProfile?.licenceNumber ?? "",
      regulator: brokerProfile?.regulator ?? "OACIQ",
      email: deal.broker?.email ?? "",
    };

    const listingPayload = {
      title: listing?.title ?? "",
      listingCode: listing?.listingCode ?? "",
      addressSummary: listing ? `${listing.listingType} · co-ownership: ${listing.isCoOwnership}` : "",
      priceDisplay: listing ? String(listing.price) : "",
    };

    const dealPayload = {
      dealCode: deal.dealCode ?? deal.id,
      status: deal.status,
      priceCents: String(deal.priceCents),
      priceDisplay: centsToDisplay(deal.priceCents),
      conditionsSummary,
    };

    const buyer = { name: deal.buyer.name ?? "", email: deal.buyer.email ?? "" };
    const seller = { name: deal.seller.name ?? "", email: deal.seller.email ?? "" };

    if (kind === "DEAL_INVESTOR_HANDOFF_PACKET") {
      const [latestScore, latestProb, conditions, notary] = await Promise.all([
        prisma.dealScore.findFirst({
          where: { dealId: deal.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.closeProbability.findFirst({
          where: { dealId: deal.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.dealClosingCondition.findMany({
          where: { dealId: deal.id, status: { not: "fulfilled" } },
          take: 20,
        }),
        prisma.dealNotaryCoordination.findUnique({ where: { dealId: deal.id } }),
      ]);

      let esgLine = "";
      if (deal.listingId) {
        const esg = await prisma.esgProfile.findUnique({
          where: { listingId: deal.listingId },
          select: { compositeScore: true, grade: true, certification: true },
        });
        if (esg) {
          esgLine = `ESG composite: ${esg.compositeScore ?? "n/a"} · grade ${esg.grade ?? "n/a"} · cert: ${esg.certification ?? "n/a"}`;
        }
      }

      const capital = input.capitalDealId
        ? await prisma.amfCapitalDeal.findUnique({
            where: { id: input.capitalDealId },
            select: { id: true, title: true, status: true, solicitationMode: true },
          })
        : null;

      return {
        meta,
        handoff: {
          dealCode: dealPayload.dealCode,
          dealSummary: `${dealPayload.status} · ${listingPayload.title} · ${dealPayload.priceDisplay} CAD (indicative)`,
          underwriting: JSON.stringify({
            dealScore: latestScore
              ? { score: latestScore.score, category: latestScore.category, riskLevel: latestScore.riskLevel }
              : null,
            closeProbability: latestProb
              ? { probability: latestProb.probability, category: latestProb.category }
              : null,
          }),
          diligence: conditionsSummary,
          complianceBlockers: conditions.map((c) => `${c.id}:${c.status}`).join("; ") || "none recorded",
          esg: esgLine || "none recorded",
          closingPosture: notary
            ? `Notary package: ${notary.packageStatus}; invite: ${notary.notaryInviteStatus ?? "n/a"}`
            : "Notary posture not linked on deal record.",
          capitalContext: capital ? JSON.stringify(capital) : "none",
        },
      };
    }

    if (kind === "COUNTER_PROPOSAL") {
      return {
        meta,
        deal: dealPayload,
        listing: listingPayload,
        broker,
        buyer,
        seller,
        negotiation: {
          counterSummary:
            (execMeta?.lastCounterSummary as string) || "Counter terms to be completed by broker after negotiation review.",
        },
      };
    }

    if (kind === "AMENDMENT") {
      return {
        meta,
        deal: dealPayload,
        listing: listingPayload,
        broker,
        buyer,
        seller,
        amendment: {
          summary: (execMeta?.amendmentSummary as string) || "Amendment summary to be finalized by broker.",
          partiesAck: "Parties acknowledge professional review is required before execution.",
        },
      };
    }

    if (kind === "BROKER_DISCLOSURE") {
      return {
        meta,
        deal: dealPayload,
        listing: listingPayload,
        broker,
        disclosure: {
          agencyRelationship:
            "Snapshot only — confirm agency / dual agency status in official brokerage disclosure per transaction.",
          remunerationSummary: (execMeta?.commissionSummary as string) || "To be completed per office policy.",
          materialFactsSummary: (execMeta?.materialFacts as string) || "Broker to complete from working file.",
        },
      };
    }

    if (kind === "CONFLICT_DISCLOSURE") {
      return {
        meta,
        deal: dealPayload,
        broker,
        conflict: {
          summary: (execMeta?.conflictSummary as string) || "No platform-flagged conflict snapshot — broker must attest.",
          mitigation: (execMeta?.conflictMitigation as string) || "Describe mitigation per office policy.",
        },
      };
    }

    // PROMISE_TO_PURCHASE
    return {
      meta,
      deal: dealPayload,
      listing: listingPayload,
      broker,
      buyer,
      seller,
    };
  }

  // Investment-only kinds (capitalDealId required — validated above)
  const capital = await prisma.amfCapitalDeal.findUnique({
    where: { id: input.capitalDealId! },
    include: {
      listing: {
        select: {
          title: true,
          listingCode: true,
          esgProfile: { select: { compositeScore: true, grade: true, certification: true } },
          esgRetrofitPlans: { take: 1, orderBy: { createdAt: "desc" }, select: { planName: true, strategyType: true } },
        },
      },
      corporateEntity: true,
      spvRecord: { include: { entity: true } },
      investmentPacket: true,
      brokerSnapshot: true,
    },
  });
  if (!capital) throw new Error("Capital deal not found.");

  const issuer = {
    name: capital.corporateEntity?.name ?? capital.spvRecord?.entity?.name ?? "SPV / issuer (complete legally)",
  };

  const packet = capital.investmentPacket;
  const esgSnap =
    capital.listing?.esgProfile || capital.listing?.esgRetrofitPlans?.length
      ? JSON.stringify({
          esg: capital.listing?.esgProfile,
          retrofit: capital.listing?.esgRetrofitPlans?.[0] ?? null,
        })
      : "none captured";

  const offering = {
    useOfProceeds: packet?.financialProjection ?? "Describe use of proceeds in final subscription package.",
    capitalStructure: capital.spvRecord?.ownershipStructureJson
      ? JSON.stringify(capital.spvRecord.ownershipStructureJson)
      : "Complete capital stack in final legal documents.",
    noGuaranteeLine:
      "No return is guaranteed; investors may lose their entire investment. Past performance is not indicative of future results.",
  };

  const base = {
    meta,
    capital: {
      title: capital.title,
      status: capital.status,
      solicitationMode: capital.solicitationMode,
      exemptionNarrative: capital.exemptionNarrative ?? "",
    },
    issuer,
    listing: {
      title: capital.listing?.title ?? "",
      listingCode: capital.listing?.listingCode ?? "",
    },
    brokerSnapshot: capital.brokerSnapshot ?? {},
    packet: {
      summary: packet?.summary ?? "Complete summary in investment packet record.",
      risks: packet?.risks ?? "Describe material risks in final disclosure.",
    },
    esg: { snapshot: esgSnap },
    offering,
    investor: { legalName: "{{ investor completes }}" },
    exemption: {
      representationChecklist:
        "Accredited / eligible investor status; residency; investment limits — finalize with compliance.",
    },
    questionnaire: {
      items: JSON.stringify([
        { q: "Experience with private investments?", type: "text" },
        { q: "Percentage of net worth represented?", type: "text" },
        { q: "Liquidity needs (horizon)?", type: "text" },
      ]),
    },
    risks: {
      liquidity: "Private investments are illiquid.",
      concentration: "Concentration risk applies — diversify where appropriate.",
    },
  };

  return base;
}
