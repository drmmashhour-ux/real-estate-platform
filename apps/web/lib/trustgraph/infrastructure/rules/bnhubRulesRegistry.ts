import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { evaluateBookingAnomalyRule } from "@/lib/trustgraph/infrastructure/rules/bookingAnomalyRule";
import { evaluateBookingDepositRecommendationRule } from "@/lib/trustgraph/infrastructure/rules/bookingDepositRecommendationRule";
import { evaluateGuestIdentityCompletenessRule } from "@/lib/trustgraph/infrastructure/rules/guestIdentityCompletenessRule";
import { evaluateHostIdentityCompletenessRule } from "@/lib/trustgraph/infrastructure/rules/hostIdentityCompletenessRule";
import { evaluateHostPropertyAuthorizationRule } from "@/lib/trustgraph/infrastructure/rules/hostPropertyAuthorizationRule";
import { evaluateShortStayRiskRule } from "@/lib/trustgraph/infrastructure/rules/shortStayRiskRule";
import { evaluateShortTermListingQualityRule } from "@/lib/trustgraph/infrastructure/rules/shortTermListingQualityRule";

export function collectBnhubHostRuleResults(ctx: {
  name: string | null;
  email: string | null;
  phone: string | null;
  ownershipConfirmationStatus: string;
}): RuleEvaluationResult[] {
  return [
    evaluateHostIdentityCompletenessRule(ctx),
    evaluateHostPropertyAuthorizationRule({ ownershipConfirmationStatus: ctx.ownershipConfirmationStatus }),
  ];
}

export function collectBnhubGuestRuleResults(ctx: {
  email: string;
  name: string | null;
  phone: string | null;
}): RuleEvaluationResult[] {
  return [evaluateGuestIdentityCompletenessRule(ctx)];
}

export function collectShortTermListingRuleResults(ctx: {
  title: string;
  description: string | null;
  photoCount: number;
  houseRules: string | null;
}): RuleEvaluationResult[] {
  return [evaluateShortTermListingQualityRule(ctx)];
}

export function collectBookingRiskRuleResults(ctx: {
  createdAt: Date;
  checkIn: Date;
  nights: number;
  totalCents: number;
}): RuleEvaluationResult[] {
  return [
    evaluateBookingAnomalyRule({ createdAt: ctx.createdAt, checkIn: ctx.checkIn }),
    evaluateShortStayRiskRule({ nights: ctx.nights }),
    evaluateBookingDepositRecommendationRule({ totalCents: ctx.totalCents }),
  ];
}
