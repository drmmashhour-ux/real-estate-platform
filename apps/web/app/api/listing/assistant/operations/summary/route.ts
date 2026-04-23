import { NextResponse } from "next/server";

import { buildListingAssistantOperationsDashboard } from "@/modules/listing-assistant/listing-assistant-operations.service";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  const payload = await buildListingAssistantOperationsDashboard({
    actorUserId: gate.session.id,
    isAdmin: gate.session.role === "ADMIN",
  });

  return NextResponse.json(payload);
}
