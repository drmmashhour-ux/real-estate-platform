import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getListingById } from "@/lib/bnhub/listings";
import {
  parseFormDataJson,
  validateSellerDeclarationForSubmission,
  type SellerDeclarationFormData,
} from "@/lib/bnhub/seller-declaration-form-data";
import { ensureComplianceReviewPending } from "@/lib/contracts/compliance-review-service";
import { getSellerDisclosure, upsertSellerDisclosure } from "@/lib/bnhub/seller-disclosure";

export const dynamic = "force-dynamic";

/** GET: fetch disclosure for a listing (owner only). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id: listingId } = await params;
  const listing = await getListingById(listingId);
  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const disclosure = await getSellerDisclosure(listingId);
  return Response.json(disclosure ?? null);
}

/** POST: submit or decline Seller Declaration. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id: listingId } = await params;
  const listing = await getListingById(listingId);
  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const declined = Boolean(body.declined);

  if (declined) {
    const disclosure = await upsertSellerDisclosure({
      listingId,
      declined: true,
    });
    if (!disclosure) {
      return Response.json({ error: "Failed to save disclosure" }, { status: 500 });
    }
    return Response.json(disclosure);
  }

  const raw = body.formData;
  if (raw == null || typeof raw !== "object") {
    return Response.json({ error: "formData is required" }, { status: 400 });
  }
  const fd: SellerDeclarationFormData = parseFormDataJson(raw);
  const validationError = validateSellerDeclarationForSubmission(fd);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }
  fd.signature = {
    ...fd.signature,
    agreed: true,
    typedName: fd.signature?.typedName?.trim(),
    signedAt: new Date().toISOString(),
  };

  const disclosure = await upsertSellerDisclosure({
    listingId,
    formData: fd,
    declined: false,
  });
  if (!disclosure) {
    return Response.json({ error: "Failed to save disclosure" }, { status: 500 });
  }
  await ensureComplianceReviewPending(listingId).catch(() => {});
  return Response.json(disclosure);
}
