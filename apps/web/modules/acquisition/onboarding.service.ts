import { prisma } from "@/lib/db";

import type { OnboardingProgressVm } from "./acquisition.types";
import { notifyAcquisitionAdmins } from "./acquisition-notifications.service";

const MILESTONE_WEIGHT = 25;

export function completionPercentFromMilestones(m: {
  accountCreatedAt: Date | null;
  firstListingAt: Date | null;
  firstBookingOrLeadAt: Date | null;
  subscriptionActivatedAt: Date | null;
}): number {
  let pts = 0;
  if (m.accountCreatedAt) pts += MILESTONE_WEIGHT;
  if (m.firstListingAt) pts += MILESTONE_WEIGHT;
  if (m.firstBookingOrLeadAt) pts += MILESTONE_WEIGHT;
  if (m.subscriptionActivatedAt) pts += MILESTONE_WEIGHT;
  return Math.min(100, pts);
}

export async function computeOnboardingProgress(userId: string): Promise<OnboardingProgressVm> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, plan: true, updatedAt: true },
  });
  if (!user) {
    return {
      userId,
      completionPercent: 0,
      milestones: {
        accountCreatedAt: null,
        firstListingAt: null,
        firstBookingOrLeadAt: null,
        subscriptionActivatedAt: null,
      },
    };
  }

  const [fsbo, crm, stay, lead, booking] = await Promise.all([
    prisma.fsboListing.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.listing.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.shortTermListing.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.lead.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.booking.findFirst({
      where: { guestId: userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  const listingTs = [fsbo?.createdAt, crm?.createdAt, stay?.createdAt].filter(Boolean) as Date[];
  const firstListingAt = listingTs.length ? new Date(Math.min(...listingTs.map((d) => d.getTime()))) : null;

  const activityTs = [lead?.createdAt, booking?.createdAt].filter(Boolean) as Date[];
  const firstBookingOrLeadAt = activityTs.length ? new Date(Math.min(...activityTs.map((d) => d.getTime()))) : null;

  let subscriptionActivatedAt: Date | null = null;
  if (user.plan && user.plan !== "free") {
    subscriptionActivatedAt = user.updatedAt;
  }

  const milestones = {
    accountCreatedAt: user.createdAt,
    firstListingAt,
    firstBookingOrLeadAt,
    subscriptionActivatedAt,
  };

  const completionPercent = completionPercentFromMilestones(milestones);

  return {
    userId,
    completionPercent,
    milestones: {
      accountCreatedAt: milestones.accountCreatedAt.toISOString(),
      firstListingAt: milestones.firstListingAt?.toISOString() ?? null,
      firstBookingOrLeadAt: milestones.firstBookingOrLeadAt?.toISOString() ?? null,
      subscriptionActivatedAt: milestones.subscriptionActivatedAt?.toISOString() ?? null,
    },
  };
}

export async function upsertOnboardingSnapshot(userId: string): Promise<void> {
  const progress = await computeOnboardingProgress(userId);
  const first = progress.milestones.accountCreatedAt ? new Date(progress.milestones.accountCreatedAt) : null;

  await prisma.lecipmAcquisitionOnboardingSnapshot.upsert({
    where: { userId },
    create: {
      userId,
      accountCreatedAt: first,
      firstListingAt: progress.milestones.firstListingAt ? new Date(progress.milestones.firstListingAt) : null,
      firstBookingOrLeadAt: progress.milestones.firstBookingOrLeadAt ? new Date(progress.milestones.firstBookingOrLeadAt) : null,
      subscriptionActivatedAt: progress.milestones.subscriptionActivatedAt
        ? new Date(progress.milestones.subscriptionActivatedAt)
        : null,
      completionPercentCached: progress.completionPercent,
    },
    update: {
      accountCreatedAt: first,
      firstListingAt: progress.milestones.firstListingAt ? new Date(progress.milestones.firstListingAt) : null,
      firstBookingOrLeadAt: progress.milestones.firstBookingOrLeadAt ? new Date(progress.milestones.firstBookingOrLeadAt) : null,
      subscriptionActivatedAt: progress.milestones.subscriptionActivatedAt
        ? new Date(progress.milestones.subscriptionActivatedAt)
        : null,
      completionPercentCached: progress.completionPercent,
    },
  });

  if (
    progress.completionPercent === 100 &&
    (before?.completionPercentCached ?? 0) < 100
  ) {
    await notifyAcquisitionAdmins("acquisition_onboarding_complete", { userId });
  }
}
