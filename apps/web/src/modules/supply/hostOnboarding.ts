import { prisma } from "@/lib/db";

export type HostOnboardingStage =
  | "not_host"
  | "no_profile"
  | "stripe_pending"
  | "stripe_ready"
  | "verified_host";

export type HostOnboardingSnapshot = {
  userId: string;
  stage: HostOnboardingStage;
  listingCount: number;
  publishedStays: number;
  stripeOnboardingComplete: boolean;
  hostTrustScore: number | null;
  verificationStatus: string | null;
};

/**
 * Supply-side host readiness (BNHUB) — payouts and trust.
 */
export async function getHostOnboardingSnapshot(userId: string): Promise<HostOnboardingSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      stripeAccountId: true,
      stripeOnboardingComplete: true,
    },
  });
  if (!user) return null;

  const isHostCapable = user.role === "HOST" || user.role === "ADMIN";
  if (!isHostCapable) {
    return {
      userId,
      stage: "not_host",
      listingCount: 0,
      publishedStays: 0,
      stripeOnboardingComplete: Boolean(user.stripeOnboardingComplete),
      hostTrustScore: null,
      verificationStatus: null,
    };
  }

  const [profile, counts] = await Promise.all([
    prisma.bnhubHostProfile.findUnique({ where: { userId } }),
    prisma.shortTermListing.groupBy({
      by: ["listingStatus"],
      where: { ownerId: userId },
      _count: { id: true },
    }),
  ]);

  let listingCount = 0;
  let publishedStays = 0;
  for (const row of counts) {
    const c = row._count.id;
    listingCount += c;
    if (row.listingStatus === "PUBLISHED") publishedStays = c;
  }

  let stage: HostOnboardingStage;
  if (!user.stripeAccountId || !user.stripeOnboardingComplete) {
    stage = "stripe_pending";
  } else if (publishedStays === 0) {
    stage = "stripe_ready";
  } else if (profile?.verificationStatus === "verified") {
    stage = "verified_host";
  } else {
    stage = profile ? "stripe_ready" : "no_profile";
  }

  return {
    userId,
    stage,
    listingCount,
    publishedStays,
    stripeOnboardingComplete: Boolean(user.stripeOnboardingComplete),
    hostTrustScore: profile?.trustScore ?? null,
    verificationStatus: profile?.verificationStatus ?? null,
  };
}
