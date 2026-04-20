import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { adminOpsFlags } from "@/config/feature-flags";
import { buildLegalEntityAuditPanel, buildListingAuditPanel } from "@/modules/audit/audit-panel.service";

export const dynamic = "force-dynamic";

function safeId(raw: string | null, max = 128): string | null {
  if (!raw || raw.length > max) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) return null;
  return raw;
}

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

    const generatedAt = new Date().toISOString();

    if (!adminOpsFlags.adminAuditPanelV1) {
      return NextResponse.json({
        panel: null,
        flags: { adminAuditPanelV1: false },
        freshness: { generatedAt },
      });
    }

    const sp = req.nextUrl.searchParams;
    const scopeType = sp.get("scopeType");

    if (scopeType === "listing") {
      const listingId = safeId(sp.get("listingId"));
      if (!listingId) {
        return NextResponse.json({ error: "listingId required" }, { status: 400 });
      }
      const panel = await buildListingAuditPanel(listingId);
      return NextResponse.json({
        panel,
        flags: { adminAuditPanelV1: true, scopeType: "listing" },
        freshness: { generatedAt },
      });
    }

    if (scopeType === "legal_entity") {
      const entityType = safeId(sp.get("entityType"), 64);
      const entityId = safeId(sp.get("entityId"));
      if (!entityType || !entityId) {
        return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
      }
      const panel = await buildLegalEntityAuditPanel(entityType, entityId);
      return NextResponse.json({
        panel,
        flags: { adminAuditPanelV1: true, scopeType: "legal_entity" },
        freshness: { generatedAt },
      });
    }

    return NextResponse.json({ error: "Invalid scopeType" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
