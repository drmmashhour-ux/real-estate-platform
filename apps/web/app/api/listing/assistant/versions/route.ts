import { NextResponse } from "next/server";

import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { compareListingContentSnapshots, listListingAssistantVersions } from "@/modules/listing-assistant/listing-version.service";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/** GET — version history + optional compare query params `fromId` & `toId`. */
export async function GET(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const listingId = (url.searchParams.get("listingId") ?? "").trim();
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  if (!(await canAccessCrmListingCompliance(gate.session.id, listingId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const versions = await listListingAssistantVersions(listingId, 50);
  const fromId = url.searchParams.get("fromId");
  const toId = url.searchParams.get("toId");

  let compare = null;
  if (fromId && toId) {
    const a = versions.find((v) => v.id === fromId);
    const b = versions.find((v) => v.id === toId);
    if (a && b) {
      compare = compareListingContentSnapshots({
        from: a.content,
        to: b.content,
        fromLabel: `${a.phase} · ${a.createdAt}`,
        toLabel: `${b.phase} · ${b.createdAt}`,
      });
    }
  }

  return NextResponse.json({ versions, compare });
}
