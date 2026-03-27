import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import type { AiHub } from "../core/types";
import { summarizeForAudit } from "../core/ai-guardrails";
import { persistDecisionEngineLog } from "../core/ai-audit-log";
import {
  decisionTypeForHub,
  type DecisionEngineResult,
  type EvaluateContextInput,
} from "./decision-types";
import { priorityFromRisks } from "./decision-priority";
import {
  confidenceFromCompleteness,
  fallbackDecisionResult,
  pickNextBestAction,
  recommendationsForContext,
  summarizeDecision,
} from "./decision-rules";
import {
  risksForBooking,
  risksForDeal,
  risksForFsboListing,
  risksForInvoice,
  risksForLead,
  risksForPlatformAdmin,
  risksForShortTermListing,
  type LoadedBooking,
  type LoadedDeal,
  type LoadedInvoice,
  type LoadedLead,
  type LoadedListingFsbo,
  type LoadedListingShortTerm,
  type LoadedPlatform,
} from "./decision-risk";
import type { DecisionRiskItem } from "./decision-types";

async function loadSnapshot(input: EvaluateContextInput): Promise<{
  label: string;
  risks: DecisionRiskItem[];
  hubHint: "low" | "medium" | "high" | "critical" | null;
}> {
  const { entityType, entityId, listingVariant } = input;

  if (entityType === "platform") {
    const hub = input.hub;
    if (hub === "admin") {
      const [disputes, payouts, weekRev, bookingsToday] = await Promise.all([
        prisma.dispute.count({ where: { status: { notIn: ["RESOLVED", "REJECTED", "CLOSED", "RESOLVED_PARTIAL_REFUND", "RESOLVED_FULL_REFUND", "RESOLVED_RELOCATION"] } } }).catch(() => 0),
        prisma.payment.count({ where: { status: "COMPLETED", hostPayoutReleasedAt: null } }).catch(() => 0),
        prisma.platformPayment.aggregate({ where: { status: "paid", createdAt: { gte: new Date(Date.now() - 7 * 864e5) } }, _sum: { amountCents: true } }).catch(() => ({ _sum: { amountCents: 0 } })),
        prisma.booking.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }).catch(() => 0),
      ]);
      const row: LoadedPlatform = {
        openDisputes: disputes,
        pendingPayouts: payouts,
        unpaidInvoicesHint: 0,
        bookingsToday,
        revenueWeekCents: weekRev._sum.amountCents ?? 0,
      };
      const risks = risksForPlatformAdmin(row);
      return {
        label: "Platform (admin)",
        risks,
        hubHint: risks.some((r) => r.severity === "critical") ? "critical" : null,
      };
    }
    if (hub === "investor") {
      const deals = await prisma.investmentDeal.findMany({
        where: { userId: input.userId },
        select: { roi: true },
      });
      const scenarioCount = await prisma.portfolioScenario.count({ where: { userId: input.userId } });
      const n = deals.length;
      const avgRoi = n > 0 ? deals.reduce((s, d) => s + d.roi, 0) / n : 0;
      const rois = deals.map((d) => d.roi).filter((x) => Number.isFinite(x));
      const spread = rois.length > 1 ? Math.max(...rois) - Math.min(...rois) : 0;
      const risks: DecisionRiskItem[] = [];
      if (n === 0) {
        risks.push({
          type: "empty_portfolio",
          severity: "medium",
          explanation: "No saved analyzer deals yet — portfolio metrics are empty.",
          suggestedAction: "Run Analyze and save at least one property to unlock ROI comparisons.",
        });
      } else {
        const roiStr = Number.isFinite(avgRoi) ? avgRoi.toFixed(1) : "—";
        risks.push({
          type: "portfolio_summary",
          severity: avgRoi < 4 ? "medium" : "low",
          explanation: `${n} saved deal(s); portfolio average ROI ≈ ${roiStr}% (platform estimate, not a forecast).`,
          suggestedAction:
            spread > 3
              ? "Open Compare: align assumptions on your lowest-ROI save versus your best."
              : "Stress-test one variable (rate, rent, vacancy) in Compare before you allocate capital.",
        });
      }
      risks.push({
        type: "market_volatility",
        severity: "low",
        explanation: "External market shocks are not modeled in this assist.",
        suggestedAction: "Reconcile quarterly with audited financials or your advisor.",
      });
      return {
        label: `Portfolio (${n} saves · ${scenarioCount} scenario(s))`,
        risks,
        hubHint: !Number.isFinite(avgRoi) || avgRoi < 4 ? "medium" : "low",
      };
    }
    if (hub === "mortgage") {
      const mr = await prisma.mortgageRequest.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
      });
      if (mr?.status === "approved") {
        const amt = mr.estimatedApprovalAmount;
        const amtLabel = typeof amt === "number" && Number.isFinite(amt) ? `$${Math.round(amt).toLocaleString("en-CA")}` : "—";
        return {
          label: "Mortgage request (approved)",
          risks: [
            {
              type: "approved_simulation",
              severity: "low",
              explanation: `Latest request is approved (simulation). Estimated purchasing power ≈ ${amtLabel} — not a lender commitment.`,
              suggestedAction: "Confirm rate hold, conditions, and documentation with your lender before you shop.",
            },
          ],
          hubHint: "low",
        };
      }
      const risks: DecisionRiskItem[] = [
        {
          type: "missing_documents",
          severity: "medium",
          explanation: "Mortgage outcomes depend on documents not yet visible in this session.",
          suggestedAction: "Upload income and liability documents before rate lock discussions.",
        },
      ];
      return { label: "Platform (mortgage)", risks, hubHint: "medium" };
    }
    if (hub === "buyer") {
      const lastView = await prisma.buyerListingView.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        include: { fsboListing: { select: { title: true, city: true, priceCents: true } } },
      });
      if (lastView?.fsboListing) {
        const p = lastView.fsboListing;
        const priceNum = (p.priceCents ?? 0) / 100;
        const priceLabel = Number.isFinite(priceNum) ? `$${Math.round(priceNum).toLocaleString("en-CA")}` : "—";
        const title = p.title.length > 80 ? `${p.title.slice(0, 77)}…` : p.title;
        return {
          label: title,
          risks: [
            {
              type: "buyer_focus",
              severity: "low",
              explanation: `Recently viewed in ${p.city ?? "—"} — ask price ${priceLabel}.`,
              suggestedAction: "Compare this ask to two recent sold comps in the same neighbourhood before you contact the seller.",
            },
          ],
          hubHint: "low",
        };
      }
      return {
        label: "Buyer workspace",
        risks: [
          {
            type: "pending_action",
            severity: "low",
            explanation: "No recent listing view in this session — save a short list to compare.",
            suggestedAction: "Browse listings, save two homes, then return here for a focused assist.",
          },
        ],
        hubHint: "low",
      };
    }
    if (hub === "broker") {
      const [total, underContract] = await Promise.all([
        prisma.brokerClient.count({ where: { brokerId: input.userId } }),
        prisma.brokerClient.count({ where: { brokerId: input.userId, status: "UNDER_CONTRACT" } }),
      ]);
      if (total === 0) {
        return {
          label: "Broker workspace",
          risks: [
            {
              type: "pending_action",
              severity: "medium",
              explanation: "No CRM clients yet — response-time SLAs start at first inquiry.",
              suggestedAction: "Open the pipeline and capture every new lead within 24h.",
            },
          ],
          hubHint: "medium",
        };
      }
      return {
        label: `Broker CRM (${total} client(s)${underContract > 0 ? ` · ${underContract} under contract` : ""})`,
        risks: [
          {
            type: "pipeline_health",
            severity: underContract > 0 ? "low" : "medium",
            explanation:
              underContract > 0
                ? `${underContract} deal(s) under contract — watch financing, inspection, and closing dates.`
                : `${total} client(s) in CRM — convert qualified leads before they go cold.`,
            suggestedAction:
              underContract > 0
                ? "Open each under-contract file and confirm next milestone dates."
                : "Prioritize qualified leads and schedule follow-ups for new inquiries.",
          },
        ],
        hubHint: underContract > 0 ? "low" : "medium",
      };
    }
    if (hub === "seller") {
      return {
        label: "Seller workspace",
        risks: [
          {
            type: "incomplete_listing",
            severity: "medium",
            explanation: "Create or select a listing to unlock publish-readiness and pricing checks.",
            suggestedAction: "Start a new FSBO listing or open an existing draft.",
          },
        ],
        hubHint: "medium",
      };
    }
    if (hub === "rent") {
      return {
        label: "Long-term rent hub",
        risks: [
          {
            type: "lease_obligations",
            severity: "medium",
            explanation: "Signed leases create rent and notice obligations — verify dates and deposit rules before you commit.",
            suggestedAction: "Compare monthly rent to your budget and keep a paper trail for condition photos at move-in.",
          },
          {
            type: "missing_documents",
            severity: "low",
            explanation: "Landlords and tenants often exchange ID, references, and proof of income outside the platform.",
            suggestedAction: "Upload anything requested in the application flow and keep copies for your records.",
          },
        ],
        hubHint: "medium",
      };
    }
    return { label: "Platform", risks: [], hubHint: "low" };
  }

  if (!entityId) {
    return { label: "Unknown entity", risks: [], hubHint: "low" };
  }

  if (entityType === "listing") {
    const variant = listingVariant ?? "fsbo";
    if (variant === "fsbo") {
      const row = await prisma.fsboListing.findUnique({
        where: { id: entityId },
        include: { documents: true, verification: true },
      });
      if (!row) return { label: "Listing", risks: [], hubHint: null };
      const loaded: LoadedListingFsbo = {
        kind: "fsbo",
        id: row.id,
        title: row.title,
        priceCents: row.priceCents,
        city: row.city,
        status: row.status,
        moderationStatus: row.moderationStatus,
        descriptionLen: row.description?.length ?? 0,
        imageCount: Array.isArray(row.images) ? row.images.length : 0,
        hasDeclaration: Boolean(row.sellerDeclarationCompletedAt),
        docsCount: row.documents?.filter((d) => d.fileUrl?.trim()).length ?? 0,
      };
      return { label: row.title.slice(0, 80), risks: risksForFsboListing(loaded), hubHint: null };
    }
    if (variant === "short_term") {
      const row = await prisma.shortTermListing.findUnique({ where: { id: entityId } });
      if (!row) return { label: "Stay listing", risks: [], hubHint: null };
      const loaded: LoadedListingShortTerm = {
        kind: "short_term",
        id: row.id,
        title: row.title,
        city: row.city,
        nightPriceCents: row.nightPriceCents,
        listingStatus: row.listingStatus,
        verificationStatus: row.verificationStatus,
        maxGuests: row.maxGuests,
        cleaningFeeCents: row.cleaningFeeCents,
      };
      return { label: row.title.slice(0, 80), risks: risksForShortTermListing(loaded), hubHint: null };
    }
    const row = await prisma.listing.findUnique({ where: { id: entityId } });
    if (!row) return { label: "CRM listing", risks: [], hubHint: null };
    const risks: DecisionRiskItem[] = [
      {
        type: "incomplete_listing",
        severity: "low",
        explanation: "CRM listing — ensure broker-side documents and pricing are current.",
        suggestedAction: "Sync listing details with seller and brokerage policy.",
      },
    ];
    return { label: row.title.slice(0, 80), risks, hubHint: "low" };
  }

  if (entityType === "booking") {
    const row = await prisma.booking.findUnique({
      where: { id: entityId },
      include: { payment: true },
    });
    if (!row) return { label: "Booking", risks: [], hubHint: null };
    const loaded: LoadedBooking = {
      id: row.id,
      nights: row.nights,
      totalCents: row.totalCents,
      status: row.status,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      guestFeeCents: row.guestFeeCents,
    };
    return {
      label: `Booking ${row.confirmationCode ?? row.id.slice(0, 8)}`,
      risks: risksForBooking(loaded),
      hubHint: null,
    };
  }

  if (entityType === "lead") {
    const row = await prisma.lead.findUnique({ where: { id: entityId } });
    if (!row) return { label: "Lead", risks: [], hubHint: null };
    const loaded: LoadedLead = {
      id: row.id,
      status: row.status,
      score: row.score,
      createdAt: row.createdAt,
      messageLen: row.message?.length ?? 0,
    };
    return { label: `Lead ${row.id.slice(0, 8)}`, risks: risksForLead(loaded), hubHint: null };
  }

  if (entityType === "deal") {
    const row = await prisma.deal.findUnique({
      where: { id: entityId },
      include: { milestones: true },
    });
    if (!row) return { label: "Deal", risks: [], hubHint: null };
    const pending = row.milestones?.filter((m) => m.status.toLowerCase() !== "completed").length ?? 0;
    const loaded: LoadedDeal = {
      id: row.id,
      status: row.status,
      priceCents: row.priceCents,
      updatedAt: row.updatedAt,
      milestonePending: pending,
    };
    return { label: row.dealCode ?? `Deal ${row.id.slice(0, 8)}`, risks: risksForDeal(loaded), hubHint: null };
  }

  if (entityType === "invoice") {
    const row = await prisma.platformInvoice.findUnique({ where: { id: entityId } });
    if (!row) return { label: "Invoice", risks: [], hubHint: null };
    const loaded: LoadedInvoice = {
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      issuedAt: row.issuedAt,
      paymentStatus: row.paidAt ? "paid" : "unpaid",
      amountCents: row.amountCents,
    };
    return { label: row.invoiceNumber, risks: risksForInvoice(loaded), hubHint: null };
  }

  if (entityType === "rental_listing") {
    const row = await prisma.rentalListing.findUnique({ where: { id: entityId } });
    if (!row) return { label: "Rental listing", risks: [], hubHint: null };
    const risks: DecisionRiskItem[] = [];
    if (row.status === "DRAFT") {
      risks.push({
        type: "draft_listing",
        severity: "low",
        explanation: "Draft listings are not visible to tenants until they are active.",
        suggestedAction: "Publish from the landlord dashboard when photos and description are ready.",
      });
    }
    if ((row.description?.length ?? 0) < 120) {
      risks.push({
        type: "thin_description",
        severity: "medium",
        explanation: "Short descriptions may leave tenants unsure about inclusions, utilities, and rules.",
        suggestedAction: "Add parking, pets, appliances, and what is included in the rent.",
      });
    }
    return { label: row.title.slice(0, 80), risks, hubHint: null };
  }

  if (entityType === "rental_application") {
    const row = await prisma.rentalApplication.findUnique({
      where: { id: entityId },
      include: { listing: true, tenant: { select: { name: true, email: true } } },
    });
    if (!row) return { label: "Rental application", risks: [], hubHint: null };
    const risks: DecisionRiskItem[] = [];
    if (row.status === "PENDING") {
      risks.push({
        type: "tenant_pending_review",
        severity: "low",
        explanation: "Application is awaiting landlord decision — verify identity and references off-platform if needed.",
        suggestedAction: "Message the tenant through the platform and document acceptance in writing.",
      });
    }
    if ((row.message?.length ?? 0) < 40) {
      risks.push({
        type: "thin_application",
        severity: "medium",
        explanation: "Very short applications may hide employment history or move-in timing.",
        suggestedAction: "Ask for income band, household size, and preferred start date before accepting.",
      });
    }
    return {
      label: `Application · ${row.tenant?.name ?? row.tenant?.email ?? row.id.slice(0, 8)}`,
      risks,
      hubHint: null,
    };
  }

  if (entityType === "rental_lease") {
    const row = await prisma.rentalLease.findUnique({
      where: { id: entityId },
      include: { payments: { orderBy: { dueDate: "asc" }, take: 6 } },
    });
    if (!row) return { label: "Rental lease", risks: [], hubHint: null };
    const risks: DecisionRiskItem[] = [];
    if (row.status === "PENDING_SIGNATURE") {
      risks.push({
        type: "unsigned_lease",
        severity: "high",
        explanation: "Lease is not active until signed — rent and access terms are not enforceable through the platform alone.",
        suggestedAction: "Review the draft, sign electronically, and keep a PDF copy.",
      });
    }
    const late = row.payments.filter((p) => p.status === "LATE").length;
    if (late > 0) {
      risks.push({
        type: "late_rent",
        severity: "high",
        explanation: `${late} late payment(s) recorded — review notices and payment plan before escalation.`,
        suggestedAction: "Document payment attempts and follow local landlord-tenant rules.",
      });
    }
    return { label: `Lease ${row.id.slice(0, 8)}`, risks, hubHint: late > 0 ? "high" : null };
  }

  return { label: "Entity", risks: [], hubHint: null };
}

/**
 * Central AI Decision Engine — rule-based analysis, risk detection, prioritized actions.
 * Does not execute payments, publish listings, or sign contracts.
 */
export async function evaluateContext(input: EvaluateContextInput): Promise<DecisionEngineResult> {
  const decisionType = decisionTypeForHub(input.hub);
  let { label, risks, hubHint } = await loadSnapshot(input);

  /** Demo guarantee: always at least one recommendation-worthy signal */
  if (risks.length === 0 && input.entityType !== "platform") {
    risks = [
      {
        type: "optimization",
        severity: "low",
        explanation: "No blocking risks detected in this snapshot — continue best-practice checks.",
        suggestedAction: "Schedule a quick manual review of the next milestone anyway.",
      },
    ];
  }

  if (risks.length === 0 && input.entityType === "platform" && input.hub === "investor") {
    risks.push({
      type: "optimization",
      severity: "low",
      explanation: "Platform metrics look routine — still verify against raw exports.",
      suggestedAction: "Download CSV and reconcile one line item.",
    });
  }

  const recommendations = recommendationsForContext({
    hub: input.hub,
    risks,
    snapshotLabel: label,
  });

  const priorityLevel = priorityFromRisks(risks, hubHint);
  const nextBestAction = pickNextBestAction(recommendations, risks, input.hub);
  const summary = summarizeDecision({
    hub: input.hub,
    entityLabel: label,
    priorityLevel,
    riskCount: risks.length,
  });
  const confidenceScore = confidenceFromCompleteness({
    riskCount: risks.length,
    recCount: recommendations.length,
    hasEntity: Boolean(input.entityId) || input.entityType === "platform",
  });

  const reasoning = [
    `${priorityLevel} priority from ${risks.length} signal(s).`,
    recommendations.length ? `${recommendations.length} concrete actions below.` : "",
    "Rule-based assist — not lender, legal, or tax advice.",
  ]
    .filter(Boolean)
    .join(" ");

  const result: DecisionEngineResult = {
    summary,
    risks,
    recommendations,
    priorityLevel,
    nextBestAction,
    confidenceScore,
    decisionType,
    reasoning,
  };

  if (!input.skipLog) {
    try {
      await persistDecisionEngineLog({
        userId: input.userId,
        role: input.userRole,
        hub: input.hub as AiHub,
        decisionType,
        riskLevel: priorityLevel,
        inputSummary: summarizeForAudit(
          {
            entityType: input.entityType,
            entityId: input.entityId,
            listingVariant: input.listingVariant,
          },
          4000
        ),
        outputSummary: summarizeForAudit(
          {
            summary: result.summary,
            nextBestAction: result.nextBestAction,
            riskTypes: risks.map((r) => r.type),
          },
          8000
        ),
      });
    } catch (e) {
      logError("[evaluateContext] log failed", e);
    }
  }

  return result;
}

/** Wraps `evaluateContext` with a non-throwing fallback for UI surfaces. */
export async function safeEvaluateDecision(input: EvaluateContextInput): Promise<DecisionEngineResult> {
  try {
    return await evaluateContext(input);
  } catch (e) {
    logError("[safeEvaluateDecision]", e);
    return fallbackDecisionResult(input.hub);
  }
}
