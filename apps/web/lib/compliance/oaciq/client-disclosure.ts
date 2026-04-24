import type { OaciqClientDisclosureFlow } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logOaciqComplianceTagged } from "@/lib/server/launch-logger";

/** Exact checkbox label enforced server-side (OACIQ client protection). */
export const OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT =
  "I acknowledge the broker's role and disclosures";

export const OACIQ_CLIENT_DISCLOSURE_COPY_VERSION = "v1_oaciq_client_disclosure_2026";

export const OACIQ_BROKER_INTEREST_ALERT_TEXT =
  "This transaction involves a disclosed broker interest.";

const ACK_TTL_MS = 24 * 60 * 60 * 1000;

export function oaciqClientDisclosureEnforcementEnabled(): boolean {
  return process.env.LECIPM_OACIQ_CLIENT_DISCLOSURE_ENFORCEMENT === "1";
}

// --- Phase 1: named disclosure types (copy blocks) ---

export interface BrokerStatusDisclosure {
  kind: "BROKER_STATUS";
  title: string;
  body: string;
}

export interface ConflictDisclosure {
  kind: "CONFLICT";
  title: string;
  body: string;
}

export interface FinancialInterestDisclosure {
  kind: "FINANCIAL_INTEREST";
  title: string;
  body: string;
}

export const DEFAULT_BROKER_STATUS_TITLE = "Brokerage status (OACIQ)";
export const DEFAULT_CONFLICT_TITLE = "Conflict of interest";
export const DEFAULT_FINANCIAL_INTEREST_TITLE = "Financial or other interest";

export function defaultBrokerStatusDisclosureBody(): string {
  return [
    "Your broker must act with competence, loyalty, transparency, and fairness.",
    "The broker explains their role (buyer's broker, seller's broker, or dual agency where permitted) and what it means for you.",
    "If you have questions about representation, ask your broker before you sign or make an offer.",
  ].join("\n");
}

export function defaultConflictDisclosureBody(): string {
  return [
    "You must be informed of any situation that could place the broker's interests in conflict with yours.",
    "Where a conflict exists, the broker explains it in plain language and follows applicable brokerage rules.",
  ].join("\n");
}

export function defaultFinancialInterestDisclosureBody(): string {
  return [
    "You must be informed if the broker or a related person has a financial or other personal interest related to the transaction.",
    "This does not replace independent legal or tax advice when you need it.",
  ].join("\n");
}

export type OaciqDisclosureBundle = {
  copyVersion: string;
  bundleVersion: number;
  hasBrokerConflict: boolean;
  hasBrokerFinancialInterest: boolean;
  brokerStatus: BrokerStatusDisclosure;
  conflict: ConflictDisclosure;
  financialInterest: FinancialInterestDisclosure;
  conflictAlertText: string | null;
};

function buildBundleFromProfile(row: {
  bundleVersion: number;
  hasBrokerConflict: boolean;
  hasBrokerFinancialInterest: boolean;
  brokerStatusBody: string;
  conflictBody: string;
  financialInterestBody: string;
}): OaciqDisclosureBundle {
  const conflictAlertText = row.hasBrokerConflict ? OACIQ_BROKER_INTEREST_ALERT_TEXT : null;
  return {
    copyVersion: OACIQ_CLIENT_DISCLOSURE_COPY_VERSION,
    bundleVersion: row.bundleVersion,
    hasBrokerConflict: row.hasBrokerConflict,
    hasBrokerFinancialInterest: row.hasBrokerFinancialInterest,
    brokerStatus: {
      kind: "BROKER_STATUS",
      title: DEFAULT_BROKER_STATUS_TITLE,
      body: row.brokerStatusBody,
    },
    conflict: {
      kind: "CONFLICT",
      title: DEFAULT_CONFLICT_TITLE,
      body: row.conflictBody,
    },
    financialInterest: {
      kind: "FINANCIAL_INTEREST",
      title: DEFAULT_FINANCIAL_INTEREST_TITLE,
      body: row.financialInterestBody,
    },
    conflictAlertText,
  };
}

export function formatOaciqDisclosurePlainText(bundle: OaciqDisclosureBundle): string {
  const lines = [
    `=== ${bundle.brokerStatus.title} ===`,
    bundle.brokerStatus.body,
    "",
    `=== ${bundle.conflict.title} ===`,
    bundle.conflict.body,
    "",
    `=== ${bundle.financialInterest.title} ===`,
    bundle.financialInterest.body,
    "",
    `Bundle v${bundle.bundleVersion} (${bundle.copyVersion})`,
  ];
  if (bundle.conflictAlertText) {
    lines.unshift(bundle.conflictAlertText, "");
  }
  return lines.join("\n");
}

export function formatOaciqDisclosureHtmlAppendix(bundle: OaciqDisclosureBundle): string {
  const alert = bundle.conflictAlertText
    ? `<p role="alert" style="font-weight:600;margin-bottom:1em">${escapeHtml(bundle.conflictAlertText)}</p>`
    : "";
  return `
<section class="oaciq-client-disclosure-appendix" data-oaciq-bundle-version="${bundle.bundleVersion}">
  <h2>OACIQ — Client disclosures (record)</h2>
  ${alert}
  <h3>${escapeHtml(bundle.brokerStatus.title)}</h3>
  <p style="white-space:pre-wrap">${escapeHtml(bundle.brokerStatus.body)}</p>
  <h3>${escapeHtml(bundle.conflict.title)}</h3>
  <p style="white-space:pre-wrap">${escapeHtml(bundle.conflict.body)}</p>
  <h3>${escapeHtml(bundle.financialInterest.title)}</h3>
  <p style="white-space:pre-wrap">${escapeHtml(bundle.financialInterest.body)}</p>
  <p style="font-size:0.85em;color:#555">Snapshot: ${escapeHtml(bundle.copyVersion)} / bundle v${bundle.bundleVersion}</p>
</section>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function ensureOaciqTransactionDisclosureProfile(transactionId: string) {
  const existing = await prisma.oaciqTransactionDisclosureProfile.findUnique({
    where: { transactionId },
  });
  if (existing) return existing;

  return prisma.oaciqTransactionDisclosureProfile.create({
    data: {
      transactionId,
      brokerStatusBody: defaultBrokerStatusDisclosureBody(),
      conflictBody: defaultConflictDisclosureBody(),
      financialInterestBody: defaultFinancialInterestDisclosureBody(),
      hasBrokerConflict: false,
      hasBrokerFinancialInterest: false,
      bundleVersion: 1,
    },
  });
}

/** Broker-only: update disclosure copy / flags; bumps bundleVersion when copy or flags change (invalidates stale acks). */
export async function updateOaciqTransactionDisclosureProfile(input: {
  transactionId: string;
  brokerUserId: string;
  patch: Partial<{
    brokerStatusBody: string;
    conflictBody: string;
    financialInterestBody: string;
    hasBrokerConflict: boolean;
    hasBrokerFinancialInterest: boolean;
  }>;
}): Promise<void> {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: input.transactionId },
    select: { brokerId: true },
  });
  if (!tx?.brokerId || tx.brokerId !== input.brokerUserId) {
    throw new Error("Only the assigned transaction broker may update OACIQ disclosures.");
  }

  const current = await ensureOaciqTransactionDisclosureProfile(input.transactionId);
  const next = { ...input.patch };
  const textChanged =
    (next.brokerStatusBody !== undefined && next.brokerStatusBody !== current.brokerStatusBody) ||
    (next.conflictBody !== undefined && next.conflictBody !== current.conflictBody) ||
    (next.financialInterestBody !== undefined && next.financialInterestBody !== current.financialInterestBody);
  const flagChanged =
    (next.hasBrokerConflict !== undefined && next.hasBrokerConflict !== current.hasBrokerConflict) ||
    (next.hasBrokerFinancialInterest !== undefined &&
      next.hasBrokerFinancialInterest !== current.hasBrokerFinancialInterest);

  await prisma.oaciqTransactionDisclosureProfile.update({
    where: { transactionId: input.transactionId },
    data: {
      ...next,
      ...(textChanged || flagChanged ? { bundleVersion: { increment: 1 } } : {}),
    },
  });
}

export async function getOaciqDisclosureBundleForTransaction(
  transactionId: string
): Promise<OaciqDisclosureBundle> {
  const row = await ensureOaciqTransactionDisclosureProfile(transactionId);
  return buildBundleFromProfile(row);
}

export async function assertTransactionParty(transactionId: string, userId: string): Promise<void> {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: transactionId },
    select: { buyerId: true, sellerId: true },
  });
  if (!tx) throw new Error("Transaction not found");
  if (tx.buyerId !== userId && tx.sellerId !== userId) {
    throw new Error("Not authorized for this transaction disclosure");
  }
}

export async function findRealEstateTransactionIdForListingOffer(params: {
  listingId: string;
  buyerId: string;
}): Promise<string | null> {
  const row = await prisma.realEstateTransaction.findFirst({
    where: { listingId: params.listingId, buyerId: params.buyerId },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  return row?.id ?? null;
}

export async function findRealEstateTransactionIdForDeal(dealId: string): Promise<string | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { listingId: true, buyerId: true, sellerId: true },
  });
  if (!deal?.listingId) return null;
  const tx = await prisma.realEstateTransaction.findFirst({
    where: {
      listingId: deal.listingId,
      buyerId: deal.buyerId,
      sellerId: deal.sellerId,
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  return tx?.id ?? null;
}

export async function hasValidOaciqClientDisclosureAck(params: {
  transactionId: string;
  userId: string;
  flow: OaciqClientDisclosureFlow;
}): Promise<boolean> {
  const profile = await prisma.oaciqTransactionDisclosureProfile.findUnique({
    where: { transactionId: params.transactionId },
  });
  if (!profile) return false;

  const latest = await prisma.oaciqClientDisclosureAck.findFirst({
    where: {
      transactionId: params.transactionId,
      userId: params.userId,
      flow: params.flow,
      disclosureBundleVersion: profile.bundleVersion,
      ackTextExact: OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT,
    },
    orderBy: { acknowledgedAt: "desc" },
  });
  if (!latest) return false;
  return Date.now() - latest.acknowledgedAt.getTime() <= ACK_TTL_MS;
}

export async function assertOaciqClientDisclosureAck(params: {
  transactionId: string;
  userId: string;
  flow: OaciqClientDisclosureFlow;
}): Promise<void> {
  if (!oaciqClientDisclosureEnforcementEnabled()) return;
  const ok = await hasValidOaciqClientDisclosureAck(params);
  if (!ok) {
    throw new Error(
      "OACIQ client disclosure acknowledgment is required before this step. Review disclosures and confirm the mandatory checkbox."
    );
  }
}

export async function recordOaciqClientDisclosureAccepted(params: {
  transactionId: string;
  userId: string;
  flow: OaciqClientDisclosureFlow;
  ackText: string;
  clientIp: string | null;
  userAgent: string | null;
}): Promise<{ bundleVersion: number }> {
  if (params.ackText !== OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT) {
    throw new Error("Acknowledgment text must match the mandatory disclosure checkbox exactly.");
  }
  await assertTransactionParty(params.transactionId, params.userId);
  const profile = await ensureOaciqTransactionDisclosureProfile(params.transactionId);

  const row = await prisma.oaciqClientDisclosureAck.create({
    data: {
      transactionId: params.transactionId,
      userId: params.userId,
      flow: params.flow,
      ackTextExact: params.ackText,
      disclosureBundleVersion: profile.bundleVersion,
      clientIp: params.clientIp ?? undefined,
      userAgent: params.userAgent ?? undefined,
    },
  });

  logOaciqComplianceTagged.info("disclosure_accepted", {
    transactionId: params.transactionId,
    userId: params.userId,
    flow: params.flow,
    bundleVersion: profile.bundleVersion,
    acknowledgedAt: row.acknowledgedAt.toISOString(),
    outcomeHint: {
      capture: true,
      entityType: "compliance" as const,
      entityId: params.transactionId,
      actionTaken: "disclosure_accepted",
      predictedOutcome: { expectAccept: true },
      actualOutcome: { accepted: true, bundleVersion: profile.bundleVersion },
      source: "log_hook" as const,
      contextUserId: params.userId,
    },
  });

  return { bundleVersion: profile.bundleVersion };
}

export function logOaciqDisclosureShown(payload: Record<string, unknown>): void {
  logOaciqComplianceTagged.info("disclosure_shown", payload);
}

export function mergePropertyOfferConditionsWithOaciq(
  conditions: unknown,
  bundle: OaciqDisclosureBundle
): Record<string, unknown> {
  const base =
    conditions && typeof conditions === "object" && !Array.isArray(conditions)
      ? { ...(conditions as Record<string, unknown>) }
      : {};
  base._oaciqClientDisclosure = {
    injectedAt: new Date().toISOString(),
    copyVersion: bundle.copyVersion,
    bundleVersion: bundle.bundleVersion,
    plainText: formatOaciqDisclosurePlainText(bundle),
  };
  return base;
}
