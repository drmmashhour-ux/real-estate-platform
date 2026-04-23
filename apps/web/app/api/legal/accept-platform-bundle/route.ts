import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { recordAcceptance } from "@/lib/legal/acceptance";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { PLATFORM_LEGAL_BUNDLE_VERSION } from "@/lib/legal/platform-legal-version";

export const dynamic = "force-dynamic";

/**
 * POST — record platform intermediary and/or broker collaboration acknowledgments (`UserAgreement`).
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    acceptPlatform?: boolean;
    acceptBrokerCollaboration?: boolean;
    version?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const version = typeof body.version === "string" ? body.version.trim() : PLATFORM_LEGAL_BUNDLE_VERSION;
  if (version !== PLATFORM_LEGAL_BUNDLE_VERSION) {
    return NextResponse.json({ error: "Version mismatch; refresh the page" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (body.acceptPlatform) {
    await recordAcceptance(userId, LEGAL_DOCUMENT_TYPES.PLATFORM_INTERMEDIARY_DISCLOSURE, PLATFORM_LEGAL_BUNDLE_VERSION);
  }

  if (body.acceptBrokerCollaboration) {
    if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
      return NextResponse.json({ error: "Broker collaboration acceptance not applicable" }, { status: 400 });
    }
    await recordAcceptance(userId, LEGAL_DOCUMENT_TYPES.BROKER_COLLABORATION_CLAUSE, PLATFORM_LEGAL_BUNDLE_VERSION);
  }

  if (!body.acceptPlatform && !body.acceptBrokerCollaboration) {
    return NextResponse.json({ error: "Nothing to accept" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
