import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { runDealAnalyzerPhase2 } from "@/modules/deal-analyzer/application/runDealAnalyzerPhase2";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";
import { rerunPhase2BodySchema } from "@/modules/deal-analyzer/api/phase2Schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const { id } = await context.params;
  const userId = await getGuestId();
  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = Boolean(userId && listing.ownerId === userId);
  const isAdmin = await isPlatformAdmin(userId);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = rerunPhase2BodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const fin = parsed.data.financing;
  const financing =
    fin != null
      ? {
          loanPrincipalCents: fin.loanPrincipalCents ?? null,
          annualRate: fin.annualRate,
          termYears: fin.termYears,
        }
      : null;

  const out = await runDealAnalyzerPhase2({
    listingId: id,
    financing,
    shortTermListingId: parsed.data.shortTermListingId ?? null,
  });

  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  const analysis = await getDealAnalysisPublicDto(id);
  return NextResponse.json({ ok: true, steps: out.steps, analysis });
}
