import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createListingAuthority } from "@/lib/identity-network";
import { AUTHORITY_TYPES } from "@/lib/identity-network/types";

/**
 * POST /api/identity-network/property/:id/create-authority
 * Body: { authorityType, ownerIdentityId?, brokerIdentityId?, organizationIdentityId?, documentReference?, startDate, endDate?, status?, verificationStatus? }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const {
      authorityType,
      ownerIdentityId,
      brokerIdentityId,
      organizationIdentityId,
      documentReference,
      startDate,
      endDate,
      status,
      verificationStatus,
    } = body;
    if (!authorityType || !AUTHORITY_TYPES.includes(authorityType)) {
      return Response.json({ error: "authorityType must be one of: " + AUTHORITY_TYPES.join(", ") }, { status: 400 });
    }
    const start = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(start.getTime())) {
      return Response.json({ error: "Invalid startDate" }, { status: 400 });
    }
    const record = await createListingAuthority({
      propertyIdentityId,
      authorityType,
      ownerIdentityId: ownerIdentityId ?? null,
      brokerIdentityId: brokerIdentityId ?? null,
      organizationIdentityId: organizationIdentityId ?? null,
      documentReference: documentReference ?? null,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      status: status ?? "ACTIVE",
      verificationStatus: verificationStatus ?? "PENDING",
    });
    return Response.json(record);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create authority";
    return Response.json({ error: message }, { status: 400 });
  }
}
