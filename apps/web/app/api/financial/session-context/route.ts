import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireBrokerOrAdminTrustSession } from "@/lib/compliance/trust-route-guard";

export const dynamic = "force-dynamic";

/** GET — default financial owner for the signed-in broker (admin must supply owner explicitly). */
export async function GET() {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  if (session.role === PlatformRole.ADMIN) {
    return NextResponse.json({
      success: true,
      isAdmin: true,
      defaultOwner: null as { ownerType: string; ownerId: string } | null,
      userId: session.userId,
    });
  }

  return NextResponse.json({
    success: true,
    isAdmin: false,
    defaultOwner: { ownerType: "solo_broker", ownerId: session.userId },
    userId: session.userId,
  });
}
