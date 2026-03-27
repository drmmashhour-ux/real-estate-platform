import { NextRequest } from "next/server";
import {
  createEvidenceRecord,
  getEvidenceForCase,
  getCaseTimeline,
  logEvidenceAccess,
} from "@/lib/defense/evidence-preservation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseType = searchParams.get("caseType");
    const caseId = searchParams.get("caseId");
    const timeline = searchParams.get("timeline") === "true";
    const accessedBy = searchParams.get("accessedBy") ?? undefined;
    const reasonCode = searchParams.get("reasonCode") ?? "CASE_REVIEW";
    if (!caseType || !caseId) {
      return Response.json({ error: "caseType, caseId required" }, { status: 400 });
    }
    if (timeline) {
      const events = await getCaseTimeline(caseType, caseId);
      return Response.json(events);
    }
    const evidence = await getEvidenceForCase(caseType, caseId);
    // Log evidence access for each item when accessedBy is provided (audit trail).
    if (accessedBy && evidence.length > 0) {
      await Promise.all(
        evidence.map((e) =>
          logEvidenceAccess({
            evidenceId: e.id,
            accessedBy,
            accessType: "VIEW",
            reasonCode,
          })
        )
      );
    }
    return Response.json(evidence);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get evidence" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseType, caseId, classification, url, filename, mimeType, uploadedBy, metadata, retentionUntil, checksum } = body;
    if (!caseType || !caseId || !classification || !url || !uploadedBy) {
      return Response.json(
        { error: "caseType, caseId, classification, url, uploadedBy required" },
        { status: 400 }
      );
    }
    const record = await createEvidenceRecord({
      caseType,
      caseId,
      classification,
      url,
      filename,
      mimeType,
      uploadedBy,
      metadata,
      retentionUntil: retentionUntil ? new Date(retentionUntil) : undefined,
      checksum,
    });
    return Response.json(record);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create evidence record" }, { status: 500 });
  }
}
