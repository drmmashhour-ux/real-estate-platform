import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import {
  getRequiredContentLicenseVersion,
  recordContentLicenseAcceptance,
  userHasCurrentContentLicense,
} from "@/lib/legal/content-license-service";
import { persistAiInteractionLog } from "@/modules/ai/core/ai-audit-log";
import { CONTENT_LICENSE_VERSION, contentLicenseSummary } from "@/modules/legal/content-license";

export const dynamic = "force-dynamic";

/** GET — current required version + whether the signed-in user has accepted it. */
export async function GET() {
  const userId = await getGuestId();
  const requiredVersion = await getRequiredContentLicenseVersion();
  if (!userId) {
    return NextResponse.json({
      ok: true,
      requiredVersion,
      accepted: false,
      summary: contentLicenseSummary.en,
      canonicalVersion: CONTENT_LICENSE_VERSION,
    });
  }
  const accepted = await userHasCurrentContentLicense(userId);
  return NextResponse.json({
    ok: true,
    requiredVersion,
    accepted,
    summary: contentLicenseSummary.en,
    canonicalVersion: CONTENT_LICENSE_VERSION,
  });
}

/** POST — record acceptance of `version` (must match required). */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  let body: { version?: string };
  try {
    body = (await request.json()) as { version?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const required = await getRequiredContentLicenseVersion();
  const v = typeof body.version === "string" ? body.version.trim() : "";
  if (!v || v !== required) {
    return NextResponse.json(
      { error: "Version mismatch", requiredVersion: required },
      { status: 400 }
    );
  }
  await recordContentLicenseAcceptance(userId, v);
  const role = (await getUserRole()) ?? "user";
  void persistAiInteractionLog({
    userId,
    role,
    hub: "seller",
    feature: "content_license_accept",
    intent: "summary",
    context: { acceptedVersion: v, channel: "content_license_modal", userAsked: "accept_license" },
    outputText: `User accepted Platform Content & Usage License version ${v}.`,
    source: "rules",
    legalContext: true,
  });
  return NextResponse.json({ ok: true, version: v });
}
