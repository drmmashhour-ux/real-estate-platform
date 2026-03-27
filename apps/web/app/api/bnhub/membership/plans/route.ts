import { NextRequest } from "next/server";
import { listMembershipPlans } from "@/src/modules/bnhub-hospitality/services/membershipService";
import type { BnhubMembershipAudienceType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const audience = request.nextUrl.searchParams.get("audience") as BnhubMembershipAudienceType | null;
  const plans = await listMembershipPlans(audience ?? undefined);
  return Response.json({ plans });
}
