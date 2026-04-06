import type { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  assertSellerHubSubmitReady,
  hubDocumentsSatisfied,
  isSellerDeclarationComplete,
  missingDeclarationSections,
} from "@/lib/fsbo/seller-hub-validation";
import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";

type ChecklistStatus = "pass" | "warning" | "block";

export type SellHubLegalChecklistItem = {
  key: string;
  label: string;
  status: ChecklistStatus;
  detail: string;
};

export type SellHubLegalChecklist = {
  listingId: string;
  listingCode: string | null;
  title: string;
  ownerName: string | null;
  ownerEmail: string;
  ownerType: "SELLER" | "BROKER";
  brokerLicenseNumber: string | null;
  brokerCompany: string | null;
  brokerVerified: boolean;
  declarationComplete: boolean;
  missingDeclarationSections: string[];
  requiredDocumentMissing: string[];
  supportingSummary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  riskAlerts: Array<{ severity: string; message: string }>;
  blockingReasons: string[];
  items: SellHubLegalChecklistItem[];
  counts: {
    pass: number;
    warning: number;
    block: number;
  };
  publishReady: boolean;
};

function normalizeVerification(status: VerificationStatus | null | undefined): ChecklistStatus {
  if (status === "VERIFIED") return "pass";
  if (status === "PENDING") return "warning";
  return "block";
}

function titleCaseSection(section: string) {
  return section.replace(/_/g, " ");
}

export async function getSellHubLegalChecklist(listingId: string): Promise<SellHubLegalChecklist | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
          brokerVerifications: {
            select: {
              licenseNumber: true,
              brokerageCompany: true,
              verificationStatus: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
      verification: true,
      documents: { select: { docType: true, fileUrl: true, status: true } },
      sellerSupportingDocuments: { select: { category: true, status: true, declarationSectionKey: true } },
      riskAlerts: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { severity: true, message: true },
      },
    },
  });
  if (!listing) return null;

  const brokerVerification = listing.owner.brokerVerifications[0] ?? null;
  const declarationComplete = isSellerDeclarationComplete(listing);
  const declaration = migrateLegacySellerDeclaration(listing.sellerDeclarationJson);
  const missingSections = missingDeclarationSections(declaration, listing.propertyType);
  const requiredDocs = hubDocumentsSatisfied(listing.documents);
  const submitGate = await assertSellerHubSubmitReady(listing, listing.documents, listing.sellerSupportingDocuments);
  const supportingSummary = listing.sellerSupportingDocuments.reduce(
    (acc, doc) => {
      acc.total += 1;
      if (doc.status === "VERIFIED") acc.approved += 1;
      else if (doc.status === "REJECTED") acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, approved: 0, pending: 0, rejected: 0 }
  );

  const items: SellHubLegalChecklistItem[] = [
    {
      key: "listing-authority",
      label: "Listing authority",
      status:
        listing.listingOwnerType === "BROKER"
          ? brokerVerification?.verificationStatus === "VERIFIED"
            ? "pass"
            : brokerVerification?.verificationStatus === "PENDING"
              ? "warning"
              : "block"
          : "pass",
      detail:
        listing.listingOwnerType === "BROKER"
          ? brokerVerification
            ? `${brokerVerification.brokerageCompany} · license ${brokerVerification.licenseNumber} · ${brokerVerification.verificationStatus.toLowerCase()}`
            : "Broker path selected but no broker verification record is on file."
          : "Self-listed under Sell Hub Free.",
    },
    {
      key: "identity-and-address",
      label: "Identity, address, and cadastre verification",
      status:
        listing.verification == null
          ? "warning"
          : [listing.verification.identityStatus, listing.verification.addressStatus, listing.verification.cadasterStatus].includes(
                "REJECTED" as VerificationStatus
              )
            ? "block"
            : [listing.verification.identityStatus, listing.verification.addressStatus, listing.verification.cadasterStatus].every(
                  (status) => status === "VERIFIED"
                )
              ? "pass"
              : "warning",
      detail:
        listing.verification == null
          ? "Verification record has not been created yet."
          : `Identity ${listing.verification.identityStatus.toLowerCase()} · address ${listing.verification.addressStatus.toLowerCase()} · cadastre ${listing.verification.cadasterStatus.toLowerCase()}.`,
    },
    {
      key: "seller-declaration",
      label: "Seller declaration",
      status: declarationComplete ? "pass" : missingSections.length > 0 ? "block" : normalizeVerification(listing.verification?.sellerDeclarationStatus),
      detail: declarationComplete
        ? "Declaration is complete and marked ready."
        : missingSections.length > 0
          ? `Missing sections: ${missingSections.map(titleCaseSection).join(", ")}.`
          : `Declaration review is ${listing.verification?.sellerDeclarationStatus?.toLowerCase() ?? "pending"}.`,
    },
    {
      key: "required-documents",
      label: "Core listing documents",
      status: requiredDocs.ok ? "pass" : "block",
      detail: requiredDocs.ok
        ? "Required core listing documents are uploaded."
        : `Missing required documents: ${requiredDocs.missing.join(", ")}.`,
    },
    {
      key: "supporting-evidence",
      label: "Supporting evidence",
      status:
        supportingSummary.rejected > 0
          ? "block"
          : supportingSummary.pending > 0
            ? "warning"
            : supportingSummary.total > 0
              ? "pass"
              : "warning",
      detail:
        supportingSummary.total > 0
          ? `${supportingSummary.approved} approved · ${supportingSummary.pending} pending · ${supportingSummary.rejected} rejected supporting documents.`
          : "No supporting evidence uploaded yet.",
    },
    {
      key: "publish-gate",
      label: "Publish and moderation gate",
      status: submitGate.ok ? "pass" : "block",
      detail: submitGate.ok
        ? "Listing passes current Seller Hub legal submission checks."
        : `${submitGate.errors.length} blocking issue(s) must be resolved before approval.`,
    },
  ];

  const counts = items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { pass: 0, warning: 0, block: 0 }
  );

  return {
    listingId: listing.id,
    listingCode: listing.listingCode,
    title: listing.title,
    ownerName: listing.owner.name,
    ownerEmail: listing.owner.email,
    ownerType: listing.listingOwnerType,
    brokerLicenseNumber: brokerVerification?.licenseNumber ?? null,
    brokerCompany: brokerVerification?.brokerageCompany ?? null,
    brokerVerified: brokerVerification?.verificationStatus === "VERIFIED",
    declarationComplete,
    missingDeclarationSections: missingSections,
    requiredDocumentMissing: requiredDocs.missing,
    supportingSummary,
    riskAlerts: listing.riskAlerts.map((alert) => ({ severity: alert.severity, message: alert.message })),
    blockingReasons: submitGate.ok ? [] : submitGate.errors,
    items,
    counts,
    publishReady: submitGate.ok,
  };
}
