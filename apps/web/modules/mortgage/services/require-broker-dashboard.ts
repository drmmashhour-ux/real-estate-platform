import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { LECIPM_PATH_HEADER } from "@/lib/auth/session-cookie";
import { brokerHasLeadAccess } from "@/modules/mortgage/services/broker-verification";

export type BrokerDashboardSession =
  | { ok: true; userId: string; brokerId: string; isAdmin: false }
  | { ok: true; userId: string; brokerId: null; isAdmin: true };

/**
 * Broker dashboard: verified license + verified identity, or ADMIN (sees all requests).
 */
export async function requireBrokerDashboard(): Promise<BrokerDashboardSession> {
  const userId = await getGuestId();
  if (!userId) {
    const path = (await headers()).get(LECIPM_PATH_HEADER) ?? "/broker/dashboard";
    redirect(`/auth/login?next=${encodeURIComponent(path)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    const path = (await headers()).get(LECIPM_PATH_HEADER) ?? "/broker/dashboard";
    redirect(`/auth/login?next=${encodeURIComponent(path)}`);
  }

  if (user.role === "ADMIN") {
    return { ok: true, userId: user.id, brokerId: null, isAdmin: true };
  }

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      profileCompletedAt: true,
      isVerified: true,
      verificationStatus: true,
      identityStatus: true,
      idDocumentUrl: true,
      selfiePhotoUrl: true,
    },
  });
  if (!broker) {
    redirect("/auth/signup-broker");
  }

  if (!broker.profileCompletedAt) {
    redirect("/broker/complete-profile");
  }

  if (!broker.idDocumentUrl?.trim() || !broker.selfiePhotoUrl?.trim()) {
    redirect("/broker/complete-profile");
  }

  if (broker.verificationStatus === "rejected") {
    redirect("/broker/complete-profile?rejected=1");
  }

  if (broker.identityStatus === "rejected") {
    redirect("/broker/complete-profile?identity_rejected=1");
  }

  if (!brokerHasLeadAccess(broker)) {
    redirect("/broker/pending-review");
  }

  return { ok: true, userId: user.id, brokerId: broker.id, isAdmin: false };
}

/**
 * Any logged-in `MortgageBroker` (including pending verification) — e.g. pricing page.
 */
export async function requireMortgageBrokerAccount(): Promise<void> {
  const userId = await getGuestId();
  if (!userId) {
    redirect(`/auth/login?next=${encodeURIComponent("/broker/pricing")}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/broker/pricing")}`);
  }

  if (user.role === "ADMIN") {
    return;
  }

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!broker) {
    redirect("/auth/signup-broker");
  }
}
