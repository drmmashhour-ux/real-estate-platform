import { prisma } from "@/lib/db";

export async function adjustFutureActionConfidence(
  scopeType: string,
  scopeId: string,
  domain: string,
  signalKey: string,
  actionType: string,
  baseConfidence: number
) {
  const rule = await prisma.autonomyRuleWeight.findUnique({
    where: {
      scopeType_scopeId_domain_signalKey_actionType: {
        scopeType,
        scopeId,
        domain,
        signalKey,
        actionType,
      },
    },
  });

  if (!rule) return baseConfidence;

  const adjusted = Math.max(0.1, Math.min(0.99, baseConfidence * Number(rule.weight || 1)));
  return Math.round(adjusted * 10000) / 10000;
}
