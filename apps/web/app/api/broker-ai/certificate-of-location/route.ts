import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { brokerAiFlags } from "@/config/feature-flags";
import { assertCertificateOfLocationListingAccess } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-access.service";
import { loadCertificateOfLocationPresentation } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";
import { getCertificateOfLocationBlockerImpact } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-blocker.service";
import {
  attachParsedCertificateData,
  flagCertificateForAdminReview,
  markCertificateReviewed,
  requestCertificateUpload,
} from "@/modules/broker-ai/certificate-of-location/certificate-of-location-workflow.service";
import { extractCertificateOfLocationParsedData } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-parser.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!brokerAiFlags.brokerAiCertificateOfLocationV1) {
    return NextResponse.json({ error: "Certificate helper disabled." }, { status: 403 });
  }

  const listingIdRaw = req.nextUrl.searchParams.get("listingId")?.trim() ?? "";
  const brokerFlow = req.nextUrl.searchParams.get("brokerFlow") === "1";
  const offerStage = req.nextUrl.searchParams.get("offerStage") === "1";

  const userId = await getGuestId();
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null;

  const access = await assertCertificateOfLocationListingAccess({
    userId,
    role: user?.role ?? null,
    listingId: listingIdRaw,
  });

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const payload = await loadCertificateOfLocationPresentation({
    listingId: access.listingId,
    brokerFlow,
    offerStage,
  });

  const blockerImpact = getCertificateOfLocationBlockerImpact(payload.summary);

  const explainability = brokerAiFlags.brokerAiCertificateOfLocationV2
    ? payload.summary.explainability ?? null
    : null;

  const workflowActionsAvailable = brokerAiFlags.brokerAiCertificateOfLocationV2
    ? payload.viewModel.workflowActionsAvailable ?? null
    : null;

  return NextResponse.json({
    summary: payload.summary,
    viewModel: payload.viewModel,
    ...(explainability !== null ? { explainability } : {}),
    ...(workflowActionsAvailable !== null ? { workflowActionsAvailable } : {}),
    blockerImpact,
    flags: {
      brokerAiCertificateOfLocationV1: brokerAiFlags.brokerAiCertificateOfLocationV1,
      brokerAiCertificateBlockerV1: brokerAiFlags.brokerAiCertificateBlockerV1,
      brokerAiCertificateOfLocationV2: brokerAiFlags.brokerAiCertificateOfLocationV2,
    },
    freshness: new Date().toISOString(),
  });
}

type PostBody = {
  listingId?: string;
  action?: string;
  parsedPatch?: Record<string, unknown> | null;
};

export async function POST(req: NextRequest) {
  if (!brokerAiFlags.brokerAiCertificateOfLocationV1 || !brokerAiFlags.brokerAiCertificateOfLocationV2) {
    return NextResponse.json({ error: "Certificate workflow actions require V2." }, { status: 403 });
  }

  let body: PostBody | null = null;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const listingIdRaw = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  const action = typeof body?.action === "string" ? body.action.trim() : "";

  const allowed = new Set(["request_upload", "mark_reviewed", "admin_review", "attach_parsed"]);
  if (!listingIdRaw || !allowed.has(action)) {
    return NextResponse.json({ error: "listingId and a valid action are required." }, { status: 400 });
  }

  const userId = await getGuestId();
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null;

  const access = await assertCertificateOfLocationListingAccess({
    userId,
    role: user?.role ?? null,
    listingId: listingIdRaw,
  });

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const listingId = access.listingId;

  if (action === "request_upload") {
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const res = await requestCertificateUpload({ listingId, brokerUserId: userId });
    return NextResponse.json({ ok: res.ok, reason: res.reason ?? null, auditId: res.auditId ?? null });
  }

  if (action === "mark_reviewed") {
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const res = await markCertificateReviewed({ listingId, reviewerId: userId });
    return NextResponse.json({ ok: res.ok, reason: res.reason ?? null, auditId: res.auditId ?? null });
  }

  if (action === "admin_review") {
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const res = await flagCertificateForAdminReview({ listingId, brokerUserId: userId });
    return NextResponse.json({ ok: res.ok, reason: res.reason ?? null, auditId: res.auditId ?? null });
  }

  if (action === "attach_parsed") {
    const parsed = extractCertificateOfLocationParsedData(
      body.parsedPatch && typeof body.parsedPatch === "object" ? body.parsedPatch : null,
    );
    const res = await attachParsedCertificateData({ listingId, parsedData: parsed });
    return NextResponse.json({ ok: res.ok, reason: res.reason ?? null, auditId: res.auditId ?? null });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
