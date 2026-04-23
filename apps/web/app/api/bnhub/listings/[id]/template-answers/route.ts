import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getListingById } from "@/lib/bnhub/listings";
import { prisma } from "@repo/db";
import { BNHUB_LISTING_TEMPLATE_CONTRACT_TYPE } from "@/lib/contracts/listing-template-compliance";
import { resolveSellerAgreementDefinition } from "@/lib/contracts/bnhub-seller-listing-contracts";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: listingId } = await params;
  const listing = await getListingById(listingId);
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const row = await prisma.listingTemplateAnswers.findUnique({
    where: { listingId },
  });
  const def = await resolveSellerAgreementDefinition();
  return Response.json({
    answers: row?.answers ?? {},
    contractType: row?.contractType ?? BNHUB_LISTING_TEMPLATE_CONTRACT_TYPE,
    definition: def,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: listingId } = await params;
  const listing = await getListingById(listingId);
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const answers = body?.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return Response.json({ error: "answers object required" }, { status: 400 });
  }
  const row = await prisma.listingTemplateAnswers.upsert({
    where: { listingId },
    create: {
      listingId,
      contractType: BNHUB_LISTING_TEMPLATE_CONTRACT_TYPE,
      answers: answers as object,
    },
    update: { answers: answers as object },
  });
  return Response.json({ ok: true, id: row.id });
}
