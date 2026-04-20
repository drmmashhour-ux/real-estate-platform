import { NextRequest, NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { buildLegalHubContextFromDb, parseLegalActorHint } from "@/modules/legal/legal-context.service";
import { buildLegalHubSummary } from "@/modules/legal/legal-state.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const actorRaw = url.searchParams.get("actor");
    const locale = url.searchParams.get("locale") ?? "en";
    const country = url.searchParams.get("country") ?? "ca";
    const jurisdiction = url.searchParams.get("jurisdiction");

    if (!legalHubFlags.legalHubV1) {
      return NextResponse.json({
        summary: null,
        workflows: [],
        risks: [],
        documents: [],
        disclaimers: [],
        flags: legalHubFlags,
        missingDataWarnings: [],
        disabled: true,
        actorType: null,
      });
    }

    const userId = await getGuestId().catch(() => null);

    const context = await buildLegalHubContextFromDb({
      userId,
      locale,
      country,
      actorHint: actorRaw && parseLegalActorHint(actorRaw) ? actorRaw : null,
      jurisdictionHint: jurisdiction,
    });

    const summary = buildLegalHubSummary(context);

    return NextResponse.json({
      summary,
      workflows: summary.workflows,
      risks: summary.risks,
      documents: summary.documents,
      disclaimers: summary.disclaimerLines,
      flags: context.flags,
      missingDataWarnings: summary.missingDataWarnings,
      availabilityNotes: summary.availabilityNotes ?? [],
      disabled: false,
      actorType: context.actorType,
    });
  } catch {
    return NextResponse.json({
      summary: null,
      workflows: [],
      risks: [],
      documents: [],
      disclaimers: [],
      flags: legalHubFlags,
      missingDataWarnings: [],
      availabilityNotes: [],
      disabled: true,
      actorType: null,
    });
  }
}
