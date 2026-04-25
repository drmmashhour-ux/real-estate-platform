import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { getQuebecComplianceAdminView } from "@/modules/legal/compliance/listing-publish-compliance.service";

export const dynamic = "force-dynamic";

function safeListingId(raw: string | null): string | null {
  if (!raw || raw.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) return null;
  return raw;
}

/**
 * Deterministic Québec compliance checklist + decision for a listing (no raw document payloads).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const listingId = safeListingId(req.nextUrl.searchParams.get("listingId"));
    if (!listingId) {
      return NextResponse.json({ error: "listingId query required" }, { status: 400 });
    }

    const generatedAt = new Date().toISOString();
    const data = await getQuebecComplianceAdminView(listingId);

    const checklistTrimmed =
      data.checklist ?
        {
          domain: data.checklist.domain,
          readinessScore: data.checklist.readinessScore,
          blockingIssues: data.checklist.blockingIssues,
          warnings: data.checklist.warnings,
          items: data.checklist.items.map((it) => ({
            id: it.id,
            domain: it.domain,
            label: it.label,
            required: it.required,
            severity: it.severity,
            blocking: it.blocking,
          })),
          results: data.checklist.results.map((r) => ({
            itemId: r.itemId,
            passed: r.passed,
            severity: r.severity,
            message: r.message,
            evidenceFound: r.evidenceFound,
          })),
        }
      : null;

    return NextResponse.json({
      listingId,
      checklist: checklistTrimmed,
      decision: data.decision,
      flags: data.flags,
      freshness: { generatedAt },
    });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
