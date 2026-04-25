import { NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { getBrokerEngagementItems } from "@/modules/growth/broker-engagement.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }
  const items = await getBrokerEngagementItems(auth.user.id);
  return NextResponse.json({ items });
}
