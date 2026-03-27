import { prisma } from "@/lib/db";
import { resolveTrustAwarePrimaryBrokerUserId } from "@/lib/trustgraph/application/integrations/leadRoutingIntegration";

/**
 * Assigns public funnel leads (e.g. /evaluate) to a primary broker so they appear in CRM.
 * Set PRIMARY_BROKER_USER_ID in env, or we fall back to first verified BROKER user.
 */
export async function resolvePrimaryBrokerUserId(): Promise<string | undefined> {
  const explicit = process.env.PRIMARY_BROKER_USER_ID?.trim();
  if (explicit) {
    const u = await prisma.user.findFirst({
      where: { id: explicit, role: "BROKER" },
      select: { id: true },
    });
    if (u) return u.id;
  }

  const email = process.env.PRIMARY_BROKER_EMAIL?.trim().toLowerCase();
  if (email) {
    const u = await prisma.user.findFirst({
      where: { email, role: "BROKER" },
      select: { id: true },
    });
    if (u) return u.id;
  }

  const trustAware = await resolveTrustAwarePrimaryBrokerUserId();
  if (trustAware) return trustAware;

  const fallback = await prisma.user.findFirst({
    where: { role: "BROKER", brokerStatus: "VERIFIED" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (fallback) return fallback.id;

  const anyBroker = await prisma.user.findFirst({
    where: { role: "BROKER" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return anyBroker?.id;
}
