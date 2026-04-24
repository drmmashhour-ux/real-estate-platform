import { NextRequest, NextResponse } from "next/server";
import type { DigitalSignatureCaptureType } from "@prisma/client";
import { requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { legalDocumentsEngineEnabled } from "@/modules/legal-documents";
import { consentTextsForDisplay, createDigitalSignatureRecord } from "@/modules/digital-signature";

export const dynamic = "force-dynamic";

const TYPES = new Set<string>(["CLICK", "DRAWN"]);

export async function GET() {
  return NextResponse.json(consentTextsForDisplay());
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id: artifactId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    signatureType?: string;
    consentAcknowledged?: boolean;
    consentTextQuoted?: string;
    drawnPayload?: unknown;
  };

  if (!body.signatureType || !TYPES.has(body.signatureType)) {
    return NextResponse.json({ error: "signatureType must be CLICK or DRAWN" }, { status: 400 });
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  try {
    const r = await createDigitalSignatureRecord({
      artifactId,
      userId: auth.userId,
      role: auth.role,
      signatureType: body.signatureType as DigitalSignatureCaptureType,
      consentAcknowledged: Boolean(body.consentAcknowledged),
      consentTextQuoted: body.consentTextQuoted ?? "",
      ipAddress: ip,
      userAgent,
      drawnPayload: body.drawnPayload,
    });
    return NextResponse.json({
      signatureId: r.signatureId,
      documentHash: r.documentHash,
      notice:
        "Signature recorded with document integrity hash. Approval still requires broker role on this document where applicable.",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Sign failed" }, { status: 400 });
  }
}
