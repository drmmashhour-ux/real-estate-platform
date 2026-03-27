export type LegalActionInput = {
  hub: string;
  actionType: string;
  entity: Record<string, unknown>;
};

export type HeuristicLegalResult = {
  riskScore: number;
  requiresConfirmation: boolean;
  reason: string;
};

/**
 * Deterministic pre-checks before critical actions (combined with AI narrative in API).
 * riskScore 0 = low, 100 = high.
 */
export function evaluateLegalContextHeuristic(input: LegalActionInput): HeuristicLegalResult {
  const { hub, actionType, entity } = input;
  let riskScore = 15;
  const reasons: string[] = [];

  const desc = String(entity.description ?? entity.message ?? "").trim();
  const title = String(entity.title ?? "").trim();
  const imageCount = Number(entity.imageCount ?? entity.images ?? 0) || 0;

  if (actionType === "publish_listing" || actionType === "save_listing_with_photos") {
    if (desc.length > 0 && desc.length < 80) {
      riskScore += 35;
      reasons.push("Description is very short; material facts may be missing.");
    }
    if (imageCount > 0 && desc.length < 40) {
      riskScore += 25;
      reasons.push("Photos without a solid description can mislead viewers about condition.");
    }
    if (!title || title.length < 8) {
      riskScore += 20;
      reasons.push("Title or location context is thin.");
    }
  }

  if (actionType === "upload_photos") {
    if (imageCount >= 1 && desc.length < 30) {
      riskScore += 30;
      reasons.push("Uploading images without context text may not disclose property condition fairly.");
    }
  }

  if (hub === "bnhub" && actionType === "booking") {
    const checkIn = String(entity.checkIn ?? "");
    const checkOut = String(entity.checkOut ?? "");
    if (checkIn && checkOut && checkIn === checkOut) {
      riskScore += 25;
      reasons.push("Same-day or identical check-in/out dates may need verification against listing rules.");
    }
    riskScore += 10;
  }

  if (actionType === "broker_request" || actionType === "platform_broker_request") {
    if (desc.length < 20) {
      riskScore += 30;
      reasons.push("A brief broker request may omit preferences needed for compliant matching.");
    }
  }

  riskScore = Math.min(100, riskScore);

  const requiresConfirmation = riskScore >= 45;

  return {
    riskScore,
    requiresConfirmation,
    reason: reasons.length ? reasons.join(" ") : "No major automated flags; still verify accuracy before proceeding.",
  };
}

export type ReadinessHeuristic = {
  score: number;
  flags: string[];
  recommendedFixes: string[];
};

export function listingLegalReadinessHeuristic(entity: Record<string, unknown>): ReadinessHeuristic {
  const title = String(entity.title ?? "").trim();
  const description = String(entity.description ?? "").trim();
  const city = String(entity.city ?? "").trim();
  const imageCount = Number(entity.imageCount ?? 0) || 0;
  const contactEmail = String(entity.contactEmail ?? "").trim();

  let score = 55;
  const flags: string[] = [];
  const fixes: string[] = [];

  if (title.length >= 12) score += 8;
  else flags.push("Title is short or generic — clarify property type and area.");

  if (description.length >= 200) score += 15;
  else if (description.length >= 80) {
    score += 8;
    flags.push("Description could disclose more about condition, inclusions, and boundaries.");
  } else {
    flags.push("Description is thin — buyers may lack material context.");
    fixes.push("Add condition, year built, parking, and what's included.");
  }

  if (city) score += 5;
  else {
    flags.push("Location/city not clear.");
    fixes.push("Set city or neighbourhood for fair discovery.");
  }

  if (imageCount >= 4) score += 12;
  else if (imageCount >= 1) {
    score += 5;
    flags.push("More photos usually improve transparency.");
    fixes.push("Add exterior, kitchen, and key rooms.");
  } else {
    flags.push("No photos uploaded — listing may be incomplete.");
    fixes.push("Upload dated photos you have rights to use.");
  }

  if (contactEmail.includes("@")) score += 5;
  else flags.push("Contact email missing or invalid for FSBO.");

  score = Math.min(100, Math.max(0, score));

  if (fixes.length < 3) {
    fixes.push("Confirm you have the right to use all text and images.");
    if (fixes.length < 3) fixes.push("Disclose known defects you are aware of.");
  }

  return { score, flags, recommendedFixes: fixes.slice(0, 5) };
}
