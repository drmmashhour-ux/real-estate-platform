/**
 * Store recommendations, alerts, scores, and decisions for the AI Property Manager.
 */

import { prisma } from "@/lib/db";

export async function storeRecommendation(params: {
  entityType: string;
  entityId: string;
  agentType: string;
  recommendationType: string;
  title: string;
  summary: string;
  confidenceScore: number;
  priority?: string;
}) {
  return prisma.aiPropertyRecommendation.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      agentType: params.agentType,
      recommendationType: params.recommendationType,
      title: params.title,
      summary: params.summary,
      confidenceScore: Math.round(Math.min(100, Math.max(0, params.confidenceScore))),
      priority: params.priority ?? "normal",
    },
  });
}

export async function storeAlert(params: {
  entityType: string;
  entityId: string;
  alertType: string;
  severity: string;
  message: string;
  details?: object;
}) {
  return prisma.aiPropertyAlert.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      alertType: params.alertType,
      severity: params.severity,
      message: params.message,
      details: params.details ?? undefined,
    },
  });
}

export async function storeScore(params: {
  entityType: string;
  entityId: string;
  scoreType: string;
  scoreValue: number;
  scoreLabel?: string | null;
  details?: object;
}) {
  return prisma.aiPropertyScore.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      scoreType: params.scoreType,
      scoreValue: Math.round(Math.min(100, Math.max(0, params.scoreValue))),
      scoreLabel: params.scoreLabel ?? undefined,
      details: params.details ?? undefined,
    },
  });
}

export async function storeDecision(params: {
  agentType: string;
  entityType: string;
  entityId: string;
  inputSummary?: string | null;
  outputSummary?: string | null;
  confidenceScore: number;
  recommendedAction: string;
  automatedAction?: string | null;
}) {
  return prisma.aiPropertyManagerDecision.create({
    data: {
      agentType: params.agentType,
      entityType: params.entityType,
      entityId: params.entityId,
      inputSummary: params.inputSummary ?? undefined,
      outputSummary: params.outputSummary ?? undefined,
      confidenceScore: Math.round(Math.min(100, Math.max(0, params.confidenceScore))),
      recommendedAction: params.recommendedAction,
      automatedAction: params.automatedAction ?? undefined,
    },
  });
}

export async function getRecommendations(params: {
  entityType?: string;
  entityId?: string;
  agentType?: string;
  status?: string;
  limit?: number;
}) {
  return prisma.aiPropertyRecommendation.findMany({
    where: {
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.entityId && { entityId: params.entityId }),
      ...(params.agentType && { agentType: params.agentType }),
      ...(params.status && { status: params.status }),
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function getAlerts(params: {
  entityType?: string;
  entityId?: string;
  status?: string;
  limit?: number;
}) {
  return prisma.aiPropertyAlert.findMany({
    where: {
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.entityId && { entityId: params.entityId }),
      ...(params.status && { status: params.status }),
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function getScores(params: {
  entityType?: string;
  entityId?: string;
  scoreType?: string;
  limit?: number;
}) {
  return prisma.aiPropertyScore.findMany({
    where: {
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.entityId && { entityId: params.entityId }),
      ...(params.scoreType && { scoreType: params.scoreType }),
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function getDecisions(params: {
  agentType?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  return prisma.aiPropertyManagerDecision.findMany({
    where: {
      ...(params.agentType && { agentType: params.agentType }),
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.entityId && { entityId: params.entityId }),
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}
