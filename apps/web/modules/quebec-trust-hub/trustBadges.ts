import { TrustHubBadgeInfo } from "./types";

export function getTrustBadges(context: any): TrustHubBadgeInfo[] {
  const badges: TrustHubBadgeInfo[] = [];
  const { answers, acknowledgements, resultJson, identityVerified } = context;

  const acks = acknowledgements || [];
  const notices = resultJson?.notices || [];

  // 1. Notices reviewed
  const criticalNotices = notices.filter((n: any) => n.severity === "CRITICAL");
  const missingAcks = criticalNotices.filter((n: any) => !acks.find((a: any) => a.noticeKey === n.noticeKey));
  if (criticalNotices.length > 0 && missingAcks.length === 0) {
    badges.push({
      badgeKey: "NOTICES_REVIEWED",
      labelFr: "Avis consultés",
      proofJson: { totalAcks: acks.length }
    });
  }

  // 2. Representation disclosed
  if (context.representedStatus) {
    badges.push({
      badgeKey: "REPRESENTATION_DISCLOSED",
      labelFr: "Représentation déclarée",
      proofJson: { status: context.representedStatus }
    });
  }

  // 3. Warranty clarified
  if (answers?.withoutWarranty !== undefined) {
    badges.push({
      badgeKey: "WARRANTY_CLARIFIED",
      labelFr: "Garantie précisée",
      proofJson: { withoutWarranty: answers.withoutWarranty }
    });
  }

  // 4. Inclusions verified
  if (answers?.inclusions && answers.inclusions.length > 10) {
    badges.push({
      badgeKey: "INCLUSIONS_VERIFIED",
      labelFr: "Inclusions détaillées",
    });
  }

  // 5. Privacy consent recorded
  if (answers?.privacyConsent) {
    badges.push({
      badgeKey: "PRIVACY_CONSENT_RECORDED",
      labelFr: "Consentement Loi 25",
    });
  }

  // 6. AI review completed
  if (resultJson?.risks) {
    badges.push({
      badgeKey: "AI_REVIEW_COMPLETED",
      labelFr: "Analyse IA terminée",
    });
  }

  // 7. Identity verified
  if (identityVerified) {
    badges.push({
      badgeKey: "IDENTITY_VERIFIED",
      labelFr: "Identité confirmée",
    });
  }

  return badges;
}
