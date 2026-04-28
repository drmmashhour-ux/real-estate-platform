"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { recomputeSy8FeedRankForPropertyId } from "@/lib/sy8/sy8-feed-rank-refresh";
import { recomputeReputationScoreForUser } from "@/lib/syria/user-reputation";

/** ORDER SYBNB-101 — Mark listing ownership as verified after deed/proof review. */
export async function adminApproveOwnershipVerification(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  if (!id) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: {
      ownershipVerified: true,
      ownershipMoreDocsRequestedAt: null,
    },
  });
  await recomputeSy8FeedRankForPropertyId(id);
  await revalidateSyriaPaths("/admin/sybnb/properties", "/buy", "/rent", "/sybnb", "/", `/listing/${id}`);
}

/** ORDER SYBNB-101 — Soft reject: remains published; seller stays unverified until resubmission. */
export async function adminRejectOwnershipVerification(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!id) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: {
      ownershipVerified: false,
      ...(note ? { ownershipVerificationReviewNote: note } : {}),
    },
  });
  await recomputeSy8FeedRankForPropertyId(id);
  await revalidateSyriaPaths("/admin/sybnb/properties", "/buy", "/rent", "/sybnb", "/", `/listing/${id}`);
}

/** ORDER SYBNB-101 — Ask seller for clearer deed uploads (timestamp only). */
export async function adminRequestOwnershipDocuments(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!id) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: {
      ownershipMoreDocsRequestedAt: new Date(),
      ownershipVerified: false,
      ...(note ? { ownershipVerificationReviewNote: note } : {}),
    },
  });
  await recomputeSy8FeedRankForPropertyId(id);
  await revalidateSyriaPaths("/admin/sybnb/properties", `/listing/${id}`);
}

/** ORDER SYBNB-101 — Suspected fake / mismatch: hide listing from feeds + flag seller account. */
export async function adminRejectOwnershipVerificationFraud(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!id) return;

  const row = await prisma.syriaProperty.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!row) return;

  await prisma.$transaction([
    prisma.syriaProperty.update({
      where: { id },
      data: {
        status: "NEEDS_REVIEW",
        needsReview: true,
        ownershipVerified: false,
        ...(note ? { ownershipVerificationReviewNote: note } : {}),
      },
    }),
    prisma.syriaAppUser.update({
      where: { id: row.ownerId },
      data: { flagged: true },
    }),
  ]);

  await recomputeSy8FeedRankForPropertyId(id);
  await recomputeReputationScoreForUser(row.ownerId);
  await revalidateSyriaPaths("/admin/sybnb/properties", "/buy", "/rent", "/sybnb", "/", `/listing/${id}`, "/dashboard/listings");
}
