/**
 * Model Lifecycle Management – registry, versioning, deployment, rollback, drift monitoring.
 */
import { prisma } from "@/lib/db";

/** Ensure default AI models exist in registry. */
export async function ensureAiModels() {
  const defaults = [
    { key: "fraud", name: "Fraud risk", description: "Aggregates fraud signals into entity risk score" },
    { key: "pricing", name: "Dynamic pricing", description: "Nightly price and demand recommendations" },
    { key: "ranking", name: "Search ranking", description: "Listing ranking score and factors" },
    { key: "demand", name: "Demand forecast", description: "Regional demand and supply gap" },
  ];
  for (const d of defaults) {
    await prisma.aiModel.upsert({
      where: { key: d.key },
      create: d,
      update: { name: d.name, description: d.description },
    });
  }
}

/** List all AI models with latest version. */
export async function listAiModels() {
  const models = await prisma.aiModel.findMany({
    where: { active: true },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
  return models;
}

/** Register a new model version (e.g. after training). */
export async function registerModelVersion(params: {
  modelKey: string;
  version: number;
  metrics?: Record<string, number>;
  deploy?: boolean;
}) {
  const model = await prisma.aiModel.findUniqueOrThrow({ where: { key: params.modelKey } });
  const version = await prisma.modelVersion.create({
    data: {
      modelId: model.id,
      version: params.version,
      metrics: (params.metrics as object) ?? undefined,
      deployedAt: params.deploy ? new Date() : undefined,
    },
  });
  if (params.deploy) {
    await prisma.modelVersion.updateMany({
      where: { modelId: model.id, id: { not: version.id } },
      data: { deprecatedAt: new Date() },
    });
  }
  return version;
}
