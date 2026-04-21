import { NextResponse } from "next/server";
import {
  generateGreenDocuments,
  parseGreenDocumentRequestBody,
  stringifyGreenReportBundle,
} from "@/modules/green-ai/documents/document-generator";

export const dynamic = "force-dynamic";

/**
 * POST — builds JSON + PDF-ready green report bundle (runs full subsidy pipeline).
 * Optional `format: "json"` returns pretty JSON text for download clients.
 */
export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const input = parseGreenDocumentRequestBody(json);
    const { bundle, pipeline } = await generateGreenDocuments(input);

    const fmt = json.format === "json" ? "json" : "structured";
    if (fmt === "json") {
      const body = stringifyGreenReportBundle(bundle);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="lecipm-green-report-${bundle.tier}.json"`,
        },
      });
    }

    return NextResponse.json({
      bundle,
      pipelineSummary: {
        aiScore: pipeline.analysis.ai.score,
        aiLabel: pipeline.analysis.ai.label,
        estimatedGrantCad: pipeline.estimatedGrants.estimatedGrant,
        grantToPropertyValueRatio: pipeline.estimatedGrants.grantToPropertyValueRatio,
        renoclimatHeadline: pipeline.renoclimat.headline,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Report generation failed" },
      { status: 500 },
    );
  }
}
