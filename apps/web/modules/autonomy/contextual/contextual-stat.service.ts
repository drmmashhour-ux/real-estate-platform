import { prisma } from "@/lib/db";

export async function getContextualStat(params: {
  scopeType: string;
  scopeId: string;
  domain: string;
  signalKey: string;
  actionType: string;
  featureKey: string;
  featureBucket: string;
}) {
  return prisma.contextualActionStat.findUnique({
    where: {
      scopeType_scopeId_domain_signalKey_actionType_featureKey_featureBucket: {
        scopeType: params.scopeType,
        scopeId: params.scopeId,
        domain: params.domain,
        signalKey: params.signalKey,
        actionType: params.actionType,
        featureKey: params.featureKey,
        featureBucket: params.featureBucket,
      },
    },
  });
}

export async function getOrCreateContextualStat(params: {
  scopeType: string;
  scopeId: string;
  domain: string;
  signalKey: string;
  actionType: string;
  featureKey: string;
  featureBucket: string;
}) {
  const existing = await getContextualStat(params);
  if (existing) return existing;

  return prisma.contextualActionStat.create({
    data: {
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: params.domain,
      signalKey: params.signalKey,
      actionType: params.actionType,
      featureKey: params.featureKey,
      featureBucket: params.featureBucket,
    },
  });
}
