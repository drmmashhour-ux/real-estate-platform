import { prisma } from "@/lib/db";

export type CreateVerificationRequestInput = {
  userId: string;
  type: "broker" | "listing";
  listingId?: string;
  notes?: string;
};

export async function createVerificationRequest(input: CreateVerificationRequestInput) {
  if (input.type === "listing" && !input.listingId?.trim()) {
    throw new Error("listingId required for listing verification");
  }

  return prisma.verificationRequest.create({
    data: {
      userId: input.userId,
      listingId: input.listingId ?? null,
      type: input.type,
      notes: input.notes?.trim() || null,
      status: "pending",
    },
  });
}
