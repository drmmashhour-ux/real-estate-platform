import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { buildOaciqViaReferenceBundle } from "@/lib/compliance/oaciq/verify-inform-advise/bundles";

export const dynamic = "force-dynamic";

/** Reference payload for OACIQ VERIFY → INFORM → ADVISE (broker dashboard / integrations). */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    bundle: buildOaciqViaReferenceBundle(),
    signatureChain: "VERIFY → INFORM → ADVISE → SIGN",
    brokerOnlyDecision: true,
  });
}
