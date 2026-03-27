import { prisma } from "@/lib/db";

const VERIFICATION_STEPS = ["HOST_IDENTITY", "ADDRESS", "PHOTO", "OWNERSHIP"] as const;

export type VerificationStep = (typeof VERIFICATION_STEPS)[number];

export async function getListingsPendingVerification() {
  return prisma.shortTermListing.findMany({
    where: { verificationStatus: "PENDING" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { reviews: true, bookings: true } },
      verificationLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: { submittedForVerificationAt: "asc" },
  });
}

export async function approveListing(listingId: string, createdBy?: string) {
  const listing = await prisma.shortTermListing.update({
    where: { id: listingId },
    data: {
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      rejectionReason: null,
    },
  });
  for (const step of VERIFICATION_STEPS) {
    await prisma.listingVerificationLog.create({
      data: {
        listingId,
        step,
        status: "PASSED",
        notes: "Approved in batch",
        createdBy,
      },
    });
  }
  return listing;
}

export async function rejectListing(
  listingId: string,
  reason: string,
  createdBy?: string
) {
  return prisma.shortTermListing.update({
    where: { id: listingId },
    data: {
      verificationStatus: "REJECTED",
      rejectionReason: reason,
      verifiedAt: null,
    },
  });
}

export async function logVerificationStep(
  listingId: string,
  step: VerificationStep,
  status: "PASSED" | "FAILED" | "PENDING",
  notes?: string,
  createdBy?: string
) {
  return prisma.listingVerificationLog.create({
    data: { listingId, step, status, notes, createdBy },
  });
}

export async function resubmitForVerification(listingId: string) {
  return prisma.shortTermListing.update({
    where: { id: listingId },
    data: {
      verificationStatus: "PENDING",
      rejectionReason: null,
      submittedForVerificationAt: new Date(),
    },
  });
}
