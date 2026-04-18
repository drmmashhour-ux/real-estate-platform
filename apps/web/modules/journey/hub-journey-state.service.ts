import {
  getHubPlanMeta,
  HUB_JOURNEY_DEFINITIONS,
  resolveStepRoute,
} from "./hub-journey-definitions";
import { detectHubBlockers } from "./hub-blockers.service";
import {
  bumpJourneyMetric,
  recordHubVisited,
} from "./hub-journey-monitoring.service";
import type {
  HubJourneyContext,
  HubJourneyPlan,
  HubJourneyStep,
  HubJourneyStepStatus,
  HubKey,
} from "./hub-journey.types";

function isStepCompleted(
  hub: HubKey,
  stepId: string,
  ctx: HubJourneyContext,
): boolean {
  switch (hub) {
    case "buyer":
      switch (stepId) {
        case "buyer-1-area":
          return ctx.buyerCitySelected === true;
        case "buyer-2-budget":
          return ctx.buyerBudgetSet === true;
        case "buyer-3-browse":
          return (ctx.buyerBrowseSessions ?? 0) > 0;
        case "buyer-4-shortlist":
          return (ctx.buyerShortlistCount ?? 0) > 0;
        case "buyer-5-contact":
          return ctx.buyerContactedSeller === true;
        case "buyer-6-viewing":
          return ctx.buyerViewingScheduled === true;
        case "buyer-7-offer":
          return ctx.buyerOfferStarted === true;
        default:
          return false;
      }
    case "seller":
      switch (stepId) {
        case "seller-1-start":
          return ctx.sellerListingStarted === true;
        case "seller-2-details":
          return ctx.sellerDetailsComplete === true;
        case "seller-3-media":
          return (ctx.sellerPhotosCount ?? 0) >= 3;
        case "seller-4-pricing":
          return ctx.sellerPricingViewed === true;
        case "seller-5-publish":
          return ctx.sellerPublished === true;
        case "seller-6-inquiries":
          return (ctx.sellerInquiryCount ?? 0) > 0;
        case "seller-7-closing":
          return ctx.sellerDealStage === true && ctx.sellerPublished === true;
        default:
          return false;
      }
    case "rent":
      switch (stepId) {
        case "rent-1-criteria":
          return ctx.rentCriteriaSet === true;
        case "rent-2-browse":
          return ctx.rentCriteriaSet === true;
        case "rent-3-shortlist":
          return (ctx.rentShortlistCount ?? 0) > 0;
        case "rent-4-contact":
          return ctx.rentContacted === true;
        case "rent-5-visit":
          return ctx.rentVisitScheduled === true;
        case "rent-6-apply":
          return ctx.rentApplicationStarted === true;
        default:
          return false;
      }
    case "landlord":
      switch (stepId) {
        case "landlord-1-create":
          return ctx.landlordHasRentalListing === true;
        case "landlord-2-details":
          return (ctx.landlordPhotosCount ?? 0) >= 1 || ctx.landlordPublished === true;
        case "landlord-3-publish":
          return ctx.landlordPublished === true;
        case "landlord-4-leads":
          return (ctx.landlordLeadCount ?? 0) > 0;
        case "landlord-5-respond":
          return ctx.landlordResponded === true;
        case "landlord-6-shortlist":
          return (ctx.landlordLeadCount ?? 0) > 1;
        case "landlord-7-finalize":
          return ctx.landlordResponded === true && (ctx.landlordLeadCount ?? 0) > 0;
        default:
          return false;
      }
    case "bnhub_guest":
      switch (stepId) {
        case "bn-guest-1-search":
          return ctx.bnGuestSearchDone === true;
        case "bn-guest-2-compare":
          return ctx.bnGuestCompared === true;
        case "bn-guest-3-detail":
          return ctx.bnGuestOpenedDetail === true;
        case "bn-guest-4-trust":
          return ctx.bnGuestOpenedDetail === true;
        case "bn-guest-5-start-booking":
          return ctx.bnGuestBookingStarted === true;
        case "bn-guest-6-complete":
          return ctx.bnGuestBookingPaid === true;
        case "bn-guest-7-manage":
          return ctx.bnGuestStayActive === true;
        default:
          return false;
      }
    case "bnhub_host":
      switch (stepId) {
        case "bn-host-1-profile":
          return ctx.bnHostListingCreated === true;
        case "bn-host-2-details":
          return (ctx.bnHostPhotosCount ?? 0) >= 3;
        case "bn-host-3-publish":
          return ctx.bnHostPublished === true;
        case "bn-host-4-performance":
          return ctx.bnHostPublished === true;
        case "bn-host-5-quality":
          return (
            (ctx.bnHostPhotosCount ?? 0) >= 6 ||
            (ctx.bnHostPublished === true && ctx.bnHostLowConversion === false)
          );
        case "bn-host-6-bookings":
          return (ctx.bnHostBookingCount ?? 0) > 0;
        case "bn-host-7-grow":
          return (ctx.bnHostBookingCount ?? 0) > 2;
        default:
          return false;
      }
    case "broker":
      switch (stepId) {
        case "broker-1-profile":
          return ctx.brokerProfileComplete === true;
        case "broker-2-marketplace":
          return ctx.brokerProfileComplete === true;
        case "broker-3-unlocked":
          return (ctx.brokerLeadsUnlocked ?? 0) > 0;
        case "broker-4-contact":
          return (ctx.brokerLeadsContacted ?? 0) > 0;
        case "broker-5-pipeline":
          return ctx.brokerPipelineMoved === true;
        case "broker-6-closings":
          return (ctx.brokerClosedCount ?? 0) > 0;
        case "broker-7-rank":
          return (ctx.brokerClosedCount ?? 0) > 0;
        default:
          return false;
      }
    case "investor":
      switch (stepId) {
        case "inv-1-goals":
          return ctx.investorGoalsSet === true;
        case "inv-2-browse":
          return (ctx.investorBrowseCount ?? 0) > 0;
        case "inv-3-insights":
          return ctx.investorInsightsViewed === true;
        case "inv-4-shortlist":
          return (ctx.investorShortlistCount ?? 0) > 0;
        case "inv-5-analysis":
          return ctx.investorAnalysisRequested === true;
        case "inv-6-compare":
          return ctx.investorCompared === true;
        case "inv-7-action":
          return ctx.investorAnalysisRequested === true && (ctx.investorShortlistCount ?? 0) > 0;
        default:
          return false;
      }
    case "admin":
      switch (stepId) {
        case "adm-1-dashboard":
          return ctx.adminDashboardVisited === true;
        case "adm-2-revenue":
          return ctx.adminRevenueReviewed === true;
        case "adm-3-governance":
          return ctx.adminAlertsReviewed === true;
        case "adm-4-leads":
          return ctx.adminLeadQualityReviewed === true;
        case "adm-5-bnhub":
          return ctx.adminBnhubReviewed === true;
        case "adm-6-growth":
          return ctx.adminGrowthReviewed === true;
        case "adm-7-execute":
          return ctx.adminActionsExecuted === true;
        default:
          return false;
      }
    default:
      return false;
  }
}

/**
 * Deterministic journey plan from definitions + context. Does not mutate `ctx` or DB.
 */
export function buildHubJourneyPlan(hub: HubKey, ctx: HubJourneyContext): HubJourneyPlan {
  try {
    recordHubVisited(hub);
    bumpJourneyMetric("plansBuilt");
  } catch {
    /* noop */
  }

  const defs = HUB_JOURNEY_DEFINITIONS[hub];
  const meta = getHubPlanMeta(hub);
  const createdAt = new Date().toISOString();

  const completedFlags = defs.map((d) => isStepCompleted(hub, d.id, ctx));
  const completedCount = completedFlags.filter(Boolean).length;
  const total = defs.length;
  const progressPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const firstIncompleteIdx = completedFlags.findIndex((c) => !c);
  const allDone = firstIncompleteIdx < 0;

  const steps: HubJourneyStep[] = defs.map((def, idx) => {
    const completed = completedFlags[idx];
    let status: HubJourneyStepStatus;
    if (completed) {
      status = "completed";
    } else if (allDone) {
      status = "completed";
    } else if (idx === firstIncompleteIdx) {
      status = "in_progress";
    } else if (idx > firstIncompleteIdx) {
      status = "locked";
    } else {
      status = "available";
    }

    const route = resolveStepRoute(def.route, ctx.locale, ctx.country);
    return {
      ...def,
      status,
      route,
      completedAt: completed ? createdAt : undefined,
    };
  });

  const currentStepId = allDone ? defs[total - 1]?.id : defs[firstIncompleteIdx]?.id;
  const nextStepId =
    allDone || firstIncompleteIdx >= total - 1 ? undefined : defs[firstIncompleteIdx + 1]?.id;

  const blockers = detectHubBlockers(hub, ctx);
  const blockedStepIds: string[] = [];
  if (blockers.length > 0 && !allDone && firstIncompleteIdx >= 0) {
    try {
      bumpJourneyMetric("blockersDetected");
    } catch {
      /* noop */
    }
    const curId = defs[firstIncompleteIdx]?.id;
    if (curId) blockedStepIds.push(curId);
    const cur = steps[firstIncompleteIdx];
    if (cur && cur.status === "in_progress") {
      cur.status = "blocked";
      cur.blockers = blockers;
    }
  }

  return {
    hub,
    title: meta.title,
    description: meta.description,
    steps,
    progressPercent,
    currentStepId,
    nextStepId,
    blockedStepIds,
    createdAt,
  };
}
