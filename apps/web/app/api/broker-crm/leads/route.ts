import { NextRequest, NextResponse } from "next/server";
import { brokerCrmKpis, listBrokerCrmLeads, type ListLeadsFilter } from "@/lib/broker-crm/list-leads";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("filter") ?? "all";
  const allowed: ListLeadsFilter[] = [
    "all",
    "new",
    "high",
    "followup_due",
    "closed",
    "lost",
  ];
  const filter = (allowed.includes(raw as ListLeadsFilter) ? raw : "all") as ListLeadsFilter;

  const [leads, kpis] = await Promise.all([
    listBrokerCrmLeads({
      brokerUserId: auth.user.id,
      isAdmin: auth.user.role === "ADMIN",
      filter,
    }),
    brokerCrmKpis(auth.user.id, auth.user.role === "ADMIN"),
  ]);

  return NextResponse.json({ leads, kpis });
}
