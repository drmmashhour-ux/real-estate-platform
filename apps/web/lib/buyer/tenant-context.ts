import { prisma } from "@/lib/db";

/** First tenant in DB — used for buyer marketplace attribution when no cookie context. */
export async function getDefaultTenantId(): Promise<string | null> {
  const t = await prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return t?.id ?? null;
}
