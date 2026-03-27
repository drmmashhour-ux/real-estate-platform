import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { brokerHasLeadAccess } from "@/modules/mortgage/services/broker-verification";
import { assertBrokerLeadAccessAllowed } from "@/modules/legal/assert-legal";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";

/** Session for `/api/broker/session` and pricing UI — does not require verification. */
export async function getMortgageBrokerSessionForUi() {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401 as const, error: "Sign in required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return { ok: false as const, status: 401 as const, error: "Invalid session" };

  if (user.role === "ADMIN") {
    return { ok: true as const, isAdmin: true as const, plan: "admin" as const };
  }

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      plan: true,
      isVerified: true,
      verificationStatus: true,
      identityStatus: true,
      fullName: true,
      name: true,
      profileCompletedAt: true,
    },
  });
  if (!broker) {
    return { ok: false as const, status: 403 as const, error: "Broker dashboard access only" };
  }

  return {
    ok: true as const,
    isAdmin: false as const,
    brokerId: broker.id,
    plan: broker.plan,
    isVerified: broker.isVerified,
    verificationStatus: broker.verificationStatus,
    identityStatus: broker.identityStatus,
    identityVerified: broker.identityStatus === "verified",
    fullName: broker.fullName,
    name: broker.name,
    profileCompletedAt: broker.profileCompletedAt?.toISOString() ?? null,
  };
}

export type BrokerApiSession =
  | { ok: true; userId: string; brokerId: string | null; isAdmin: true }
  | {
      ok: true;
      userId: string;
      brokerId: string;
      isAdmin: false;
      plan: string;
      isVerified: boolean;
      verificationStatus: string;
      identityStatus: string;
      fullName: string | null;
      name: string;
    };

/** JSON-friendly broker auth for API routes (no redirect). */
export async function getBrokerApiSession(): Promise<
  BrokerApiSession | { ok: false; status: number; error: string; code?: string }
> {
  const userId = await getGuestId();
  if (!userId) return { ok: false, status: 401, error: "Sign in required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return { ok: false, status: 401, error: "Invalid session" };

  if (user.role === "ADMIN") {
    return { ok: true, userId: user.id, brokerId: null, isAdmin: true };
  }

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      plan: true,
      isVerified: true,
      verificationStatus: true,
      identityStatus: true,
      fullName: true,
      name: true,
    },
  });
  if (!broker) {
    return { ok: false, status: 403, error: "Broker dashboard access only" };
  }

  if (!brokerHasLeadAccess(broker)) {
    return {
      ok: false,
      status: 403,
      error: "Your profile is under review. You will gain access once approved.",
      code: "NOT_VERIFIED",
    };
  }

  if (!legalEnforcementDisabled()) {
    const legal = await assertBrokerLeadAccessAllowed(user.id);
    if (!legal.ok) {
      return {
        ok: false,
        status: 403,
        error:
          legal.blockingReasons[0] ??
          "Accept the broker platform agreement (onboarding) before accessing leads.",
        code: "LEGAL_AGREEMENT_REQUIRED",
      };
    }
  }

  return {
    ok: true,
    userId: user.id,
    brokerId: broker.id,
    isAdmin: false,
    plan: broker.plan,
    isVerified: broker.isVerified,
    verificationStatus: broker.verificationStatus,
    identityStatus: broker.identityStatus,
    fullName: broker.fullName,
    name: broker.name,
  };
}
