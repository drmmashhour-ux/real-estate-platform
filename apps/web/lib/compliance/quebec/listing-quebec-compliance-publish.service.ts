import { prisma } from "@/lib/db";
import {
  validateFrenchPublicListingContent,
  validateResidentialScopeForPublish,
  type QuebecLanguageViolation,
} from "@/lib/compliance/quebec/language-compliance.guard";
import { DEFAULT_QUEBEC_LANGUAGE_POLICY } from "@/lib/compliance/quebec/language-policy";

export type QuebecListingPublishEvaluation = {
  compliant: boolean;
  blockPublish: boolean;
  violations: QuebecLanguageViolation[];
  policy: { requireFrenchForPublicContent: boolean };
};

function mergeViolations(a: QuebecLanguageViolation[], b: QuebecLanguageViolation[]): QuebecLanguageViolation[] {
  const seen = new Set<string>();
  const out: QuebecLanguageViolation[] = [];
  for (const v of [...a, ...b]) {
    const k = `${v.code}:${v.message}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

/**
 * CRM listing → marketplace publish gate (language + residential scope).
 */
export async function validateQuebecLanguageForListingPublish(
  listingId: string,
  brokerUserId: string,
): Promise<QuebecListingPublishEvaluation> {
  const policy = DEFAULT_QUEBEC_LANGUAGE_POLICY;

  const [listing, licenceProfile] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        titleFr: true,
        assistantDraftContent: true,
      },
    }),
    prisma.lecipmBrokerLicenceProfile.findUnique({
      where: { userId: brokerUserId },
      select: { licenceType: true },
    }),
  ]);

  if (!listing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  const draftStr =
    listing.assistantDraftContent == null
      ? ""
      : typeof listing.assistantDraftContent === "string"
        ? listing.assistantDraftContent
        : JSON.stringify(listing.assistantDraftContent);

  const marketingText = [listing.title, listing.titleFr ?? "", draftStr].filter(Boolean).join("\n");

  const lang = validateFrenchPublicListingContent(
    {
      title: listing.title,
      titleFr: listing.titleFr,
      assistantDraftContent: listing.assistantDraftContent,
    },
    policy,
  );

  const scope = validateResidentialScopeForPublish({
    marketingText,
    licenceType: licenceProfile?.licenceType,
  });

  const violations = mergeViolations(lang.violations, scope.violations);
  const compliant = violations.length === 0;
  const blockPublish = !compliant;

  return {
    compliant,
    blockPublish,
    violations,
    policy: { requireFrenchForPublicContent: policy.requireFrenchForPublicContent },
  };
}
