import { NextResponse } from "next/server";
import type { LecipmLegalDocumentDispatchChannel } from "@prisma/client";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { dispatchLegalDocumentArtifact, legalDocumentsEngineEnabled } from "@/modules/legal-documents";
import type { SignatureProviderId } from "@/modules/signature/signature.types";

export const dynamic = "force-dynamic";

const CHANNELS = new Set<string>(["EMAIL", "ESIGN_ENVELOPE", "SUPPORTING_INTERNAL"]);

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Broker or administrator access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    channel?: string;
    esign?: { provider: string; participants: { name: string; role: string; email?: string | null }[] };
  };
  if (!body.channel || !CHANNELS.has(body.channel)) {
    return NextResponse.json({ error: "channel must be EMAIL | ESIGN_ENVELOPE | SUPPORTING_INTERNAL" }, { status: 400 });
  }

  try {
    const r = await dispatchLegalDocumentArtifact({
      artifactId: id,
      userId: auth.userId,
      role: auth.role,
      channel: body.channel as LecipmLegalDocumentDispatchChannel,
      esign:
        body.channel === "ESIGN_ENVELOPE" && body.esign
          ? {
              provider: body.esign.provider as SignatureProviderId,
              participants: body.esign.participants,
            }
          : undefined,
    });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Dispatch failed" }, { status: 400 });
  }
}
