import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export type SellerOnboardingPayload = {
  step?: number;
  basicInfo?: { fullName?: string; phone?: string };
  propertyAddress?: { line1?: string; city?: string; region?: string; postal?: string; country?: string };
  ownershipConfirmed?: boolean;
  idVerificationPlaceholder?: boolean;
  sellingMode?: "FSBO" | "PLATFORM_BROKER";
  completed?: boolean;
};

/**
 * GET — current seller onboarding snapshot (signed-in user).
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sellerHubOnboardingJson: true,
      sellerSellingMode: true,
      sellerOnboardingCompletedAt: true,
      sellerLegalAccuracyAcceptedAt: true,
      sellerProfileAddress: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    onboarding: user.sellerHubOnboardingJson ?? {},
    sellingMode: user.sellerSellingMode,
    completedAt: user.sellerOnboardingCompletedAt,
    legalAccuracyAcceptedAt: user.sellerLegalAccuracyAcceptedAt,
    sellerProfileAddress: user.sellerProfileAddress,
  });
}

/**
 * POST — save Seller Hub onboarding steps (merged into `sellerHubOnboardingJson`).
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: SellerOnboardingPayload;
  try {
    body = (await request.json()) as SellerOnboardingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerHubOnboardingJson: true, marketplacePersona: true },
  });
  const prev = (existing?.sellerHubOnboardingJson as Record<string, unknown> | null) ?? {};

  const merged = {
    ...prev,
    ...(body.basicInfo ? { basicInfo: body.basicInfo } : {}),
    ...(body.propertyAddress ? { propertyAddress: body.propertyAddress } : {}),
    ...(typeof body.ownershipConfirmed === "boolean" ? { ownershipConfirmed: body.ownershipConfirmed } : {}),
    ...(body.idVerificationPlaceholder === true ? { idVerifiedAt: new Date().toISOString() } : {}),
    lastStep: body.step ?? prev.lastStep,
    updatedAt: new Date().toISOString(),
  };

  const addr = body.propertyAddress;
  const sellerProfileAddress =
    addr?.line1 && addr?.city
      ? [addr.line1, addr.city, addr.region, addr.postal, addr.country].filter(Boolean).join(", ")
      : undefined;

  const data: Prisma.UserUpdateInput = {
    sellerHubOnboardingJson: merged as object,
    ...(body.sellingMode ? { sellerSellingMode: body.sellingMode } : {}),
    ...(sellerProfileAddress ? { sellerProfileAddress } : {}),
  };
  if (body.completed === true) {
    data.sellerOnboardingCompletedAt = new Date();
    if (existing?.marketplacePersona === "UNSET") {
      data.marketplacePersona = "SELLER_DIRECT";
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json({ ok: true, onboarding: merged });
}
