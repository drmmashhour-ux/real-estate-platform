import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createConciergeSession } from "@/src/modules/bnhub-hospitality/services/conciergeAIService";
import type { BnhubConciergeRoleContext } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as {
    bookingId?: string;
    listingId?: string;
    roleContext?: BnhubConciergeRoleContext;
  };
  const session = await createConciergeSession({
    userId,
    bookingId: body.bookingId ?? null,
    listingId: body.listingId ?? null,
    roleContext: body.roleContext ?? "GUEST",
  });
  return Response.json({ session });
}
