import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { COMPLIANCE_POLICY } from "@/lib/compliance/oaciq/compliance-policy";
import { oaciqAlignmentEnforcementEnabled } from "@/lib/compliance/oaciq/oaciq-alignment-layer.service";

export const dynamic = "force-dynamic";

/**
 * Platform Compliance Summary — JSON for audit / oversight (broker-scoped unless ADMIN).
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const brokerScope = user.role === PlatformRole.ADMIN ? undefined : userId;

  const [rules, events, decisionLogCount, txIds] = await Promise.all([
    prisma.oaciqComplianceRule.findMany({
      where: { active: true },
      orderBy: { ruleKey: "asc" },
    }),
    prisma.oaciqComplianceAlignmentEvent.findMany({
      where: brokerScope ? { brokerId: brokerScope } : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.oaciqBrokerDecisionLog.count({
      where: brokerScope ? { brokerId: brokerScope } : undefined,
    }),
    brokerScope
      ? prisma.realEstateTransaction.findMany({
          where: { brokerId: brokerScope },
          select: { id: true },
        })
      : prisma.realEstateTransaction.findMany({ select: { id: true }, take: 5000 }),
  ]);

  const disclosureAckCount =
    txIds.length > 0
      ? await prisma.oaciqClientDisclosureAck.count({
          where: { transactionId: { in: txIds.map((t) => t.id) } },
        })
      : 0;

  const payload = {
    title: "Platform Compliance Summary",
    generatedAt: new Date().toISOString(),
    positioning: {
      framing: "OACIQ-aligned platform assistance — broker remains responsible.",
      marketingGuardrails:
        "Do not imply regulator endorsement of the product; do not describe the software as a regulated entity.",
    },
    alignmentEnforcementEnabled: oaciqAlignmentEnforcementEnabled(),
    howSystemEnforcesOaciqObligations: [
      COMPLIANCE_POLICY.summary,
      "Alignment rules in `oaciq_compliance_rules` gate deal creation, listing publication, and contract generation when LECIPM_OACIQ_ALIGNMENT_ENFORCEMENT=1.",
      "Broker decision authority and client disclosure modules provide parallel attestations — see compliance policy `existingMechanisms`.",
    ],
    internalPolicy: COMPLIANCE_POLICY,
    activeRules: rules,
    alignmentEvents: events,
    auditCounts: {
      oaciqBrokerDecisionLogs: decisionLogCount,
      oaciqClientDisclosureAcksScoped: disclosureAckCount,
    },
    disclosureTrackingNote:
      "Client disclosure acknowledgments are counted for transactions in scope (`RealEstateTransaction` broker filter).",
  };

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="platform-compliance-summary-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
