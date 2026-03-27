import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CONTRACT_TYPES, LEASE_CONTRACT_STATUS } from "@/lib/hubs/contract-types";
import { buildBrokerAgreementSellerHtml } from "@/modules/contracts/services/templates/broker-agreement-seller-template";
import { buildBrokerAgreementBuyerHtml } from "@/modules/contracts/services/templates/broker-agreement-buyer-template";
import { buildCollaborationAgreementHtml } from "@/modules/contracts/services/templates/collaboration-agreement-template";
import { buildReferralAgreementHtml } from "@/modules/contracts/services/templates/referral-agreement-template";
import { sendContractSignRequestEmail } from "@/lib/email/contract-emails";
import { onContractReadyForSignature } from "@/modules/notifications/services/workflow-notification-triggers";

export type BrokerContractTypeKey =
  | "broker_agreement_seller"
  | "broker_agreement_buyer"
  | "referral_agreement"
  | "collaboration_agreement";

const TYPE_MAP: Record<BrokerContractTypeKey, string> = {
  broker_agreement_seller: CONTRACT_TYPES.BROKER_AGREEMENT_SELLER,
  broker_agreement_buyer: CONTRACT_TYPES.BROKER_AGREEMENT_BUYER,
  referral_agreement: CONTRACT_TYPES.REFERRAL_AGREEMENT,
  collaboration_agreement: CONTRACT_TYPES.COLLABORATION_AGREEMENT,
};

export type CreateBrokerContractInput = {
  actorId: string;
  actorRole: string;
  contractType: BrokerContractTypeKey;
  body: Record<string, unknown>;
};

function ref(): string {
  return `LEC-BR-${Date.now().toString(36).toUpperCase()}`;
}

async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  return u?.id ?? null;
}

export async function createBrokerContract(input: CreateBrokerContractInput): Promise<{ contractId: string; contractUrl: string }> {
  const isAdmin = input.actorRole === "ADMIN";
  const brokerUser = await prisma.user.findUnique({
    where: { id: input.actorId },
    select: { id: true, role: true, name: true, email: true, brokerStatus: true },
  });
  if (!brokerUser) throw new Error("User not found");
  const isBroker = brokerUser.role === "BROKER" || brokerUser.role === "ADMIN";
  if (!isAdmin && !isBroker) throw new Error("Only brokers or admins can create broker agreements");

  const r = ref();
  const now = new Date().toISOString();
  let title = "Broker agreement";
  let html = "";
  let signatures: { name: string; email: string; role: string; userId: string | null }[] = [];
  const content: Record<string, unknown> = { kind: "broker_v1", contractType: input.contractType, ref: r };

  const b = input.body;

  switch (input.contractType) {
    case "broker_agreement_seller": {
      title = "Seller brokerage agreement";
      html = buildBrokerAgreementSellerHtml({
        ref: r,
        brokerName: String(b.brokerName ?? brokerUser.name ?? "Broker"),
        brokerEmail: String(b.brokerEmail ?? brokerUser.email),
        brokerLicense: b.brokerLicense ? String(b.brokerLicense) : undefined,
        clientName: String(b.clientName ?? ""),
        clientEmail: String(b.clientEmail ?? ""),
        propertyAddress: String(b.propertyAddress ?? ""),
        exclusivity: (b.exclusivity as "exclusive" | "non_exclusive") ?? "non_exclusive",
        commissionTerms: String(b.commissionTerms ?? "As per separate schedule"),
        durationMonths: Number(b.durationMonths ?? 3),
        cancellationTerms: String(b.cancellationTerms ?? "As permitted by law and OACIQ rules."),
        generatedAt: now,
      });
      signatures = [
        { name: String(b.brokerName ?? brokerUser.name ?? "Broker"), email: String(b.brokerEmail ?? brokerUser.email), role: "broker", userId: brokerUser.id },
        { name: String(b.clientName ?? "Client"), email: String(b.clientEmail ?? ""), role: "client_seller", userId: await resolveUserIdByEmail(String(b.clientEmail ?? "")) },
      ];
      break;
    }
    case "broker_agreement_buyer": {
      title = "Buyer brokerage agreement";
      html = buildBrokerAgreementBuyerHtml({
        ref: r,
        brokerName: String(b.brokerName ?? brokerUser.name ?? "Broker"),
        brokerEmail: String(b.brokerEmail ?? brokerUser.email),
        clientName: String(b.clientName ?? ""),
        clientEmail: String(b.clientEmail ?? ""),
        searchCriteria: String(b.searchCriteria ?? ""),
        brokerObligations: String(b.brokerObligations ?? "Diligent search and disclosure as required."),
        clientObligations: String(b.clientObligations ?? "Cooperate and disclose material facts."),
        remuneration: String(b.remuneration ?? "As agreed in writing."),
        generatedAt: now,
      });
      signatures = [
        { name: String(b.brokerName ?? brokerUser.name ?? "Broker"), email: String(b.brokerEmail ?? brokerUser.email), role: "broker", userId: brokerUser.id },
        { name: String(b.clientName ?? "Client"), email: String(b.clientEmail ?? ""), role: "client_buyer", userId: await resolveUserIdByEmail(String(b.clientEmail ?? "")) },
      ];
      break;
    }
    case "collaboration_agreement": {
      title = "Broker collaboration agreement";
      html = buildCollaborationAgreementHtml({
        ref: r,
        brokerAName: String(b.brokerAName ?? ""),
        brokerAEmail: String(b.brokerAEmail ?? ""),
        brokerBName: String(b.brokerBName ?? ""),
        brokerBEmail: String(b.brokerBEmail ?? ""),
        listingRef: String(b.listingRef ?? "—"),
        roleA: String(b.roleA ?? "Listing broker"),
        roleB: String(b.roleB ?? "Cooperating broker"),
        splitTerms: String(b.splitTerms ?? "50/50 net of applicable taxes"),
        generatedAt: now,
      });
      signatures = [
        { name: String(b.brokerAName ?? "Broker A"), email: String(b.brokerAEmail ?? ""), role: "broker_a", userId: await resolveUserIdByEmail(String(b.brokerAEmail ?? "")) },
        { name: String(b.brokerBName ?? "Broker B"), email: String(b.brokerBEmail ?? ""), role: "broker_b", userId: await resolveUserIdByEmail(String(b.brokerBEmail ?? "")) },
      ];
      break;
    }
    case "referral_agreement": {
      title = "Referral agreement";
      html = buildReferralAgreementHtml({
        ref: r,
        partyAName: String(b.partyAName ?? ""),
        partyAEmail: String(b.partyAEmail ?? ""),
        partyBName: String(b.partyBName ?? ""),
        partyBEmail: String(b.partyBEmail ?? ""),
        serviceScope: String(b.serviceScope ?? ""),
        referralSource: String(b.referralSource ?? "LECIPM platform"),
        revenueShare: String(b.revenueShare ?? ""),
        generatedAt: now,
      });
      signatures = [
        { name: String(b.partyAName ?? "Party A"), email: String(b.partyAEmail ?? ""), role: "party_a", userId: await resolveUserIdByEmail(String(b.partyAEmail ?? "")) },
        { name: String(b.partyBName ?? "Party B"), email: String(b.partyBEmail ?? ""), role: "party_b", userId: await resolveUserIdByEmail(String(b.partyBEmail ?? "")) },
      ];
      break;
    }
    default:
      throw new Error("Unsupported contract type");
  }

  const typeStr = TYPE_MAP[input.contractType];
  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        type: typeStr,
        userId: brokerUser.id,
        createdById: input.actorId,
        listingId: typeof b.listingId === "string" ? b.listingId : null,
        title,
        contentHtml: html,
        content: { ...content, snapshot: b } as unknown as Prisma.InputJsonValue,
        status: LEASE_CONTRACT_STATUS.SENT,
        hub: "broker",
      },
    });
    await tx.contractSignature.createMany({
      data: signatures.map((s) => ({
        contractId: c.id,
        name: s.name,
        email: s.email,
        role: s.role,
        userId: s.userId,
      })),
    });
    return c;
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const contractUrl = `${appUrl}/contracts/${contract.id}`;

  await sendContractSignRequestEmail({
    to: [...new Set(signatures.map((s) => s.email))].filter(Boolean),
    signUrl: contractUrl,
    title,
    reference: r,
  });

  const seen = new Set<string>();
  for (const s of signatures) {
    if (s.userId && !seen.has(s.userId)) {
      seen.add(s.userId);
      void onContractReadyForSignature({
        contractId: contract.id,
        signerUserId: s.userId,
        title,
      });
    }
  }

  return { contractId: contract.id, contractUrl };
}
