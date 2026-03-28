import { prisma } from "@/lib/db";

const db = prisma as unknown as {
  globalSaaSSubscription: {
    findFirst: (args: object) => Promise<{ id: string } | null>;
    update: (args: object) => Promise<unknown>;
    create: (args: object) => Promise<unknown>;
    findMany: (args: object) => Promise<unknown[]>;
  };
};

export type SaaSPlanSlug = "starter" | "growth" | "enterprise";

export async function upsertSaasSubscription(input: {
  subjectType: "partner" | "api_key";
  subjectId: string;
  planSlug: string;
  status?: string;
  renewsAt?: Date | null;
}) {
  const existing = await db.globalSaaSSubscription.findFirst({
    where: { subjectType: input.subjectType, subjectId: input.subjectId, status: "active" },
  });
  if (existing) {
    return db.globalSaaSSubscription.update({
      where: { id: existing.id },
      data: {
        planSlug: input.planSlug,
        status: input.status ?? "active",
        renewsAt: input.renewsAt,
      },
    });
  }
  return db.globalSaaSSubscription.create({
    data: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      planSlug: input.planSlug,
      status: input.status ?? "active",
      renewsAt: input.renewsAt ?? null,
    },
  });
}

export async function listActiveSubscriptionsForSubject(subjectType: string, subjectId: string) {
  return db.globalSaaSSubscription.findMany({
    where: { subjectType, subjectId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}
