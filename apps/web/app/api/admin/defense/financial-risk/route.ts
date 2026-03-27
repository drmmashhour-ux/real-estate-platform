import { NextRequest } from "next/server";
import {
  createFinancialRiskFlag,
  getFinancialRiskFlags,
  resolveFinancialRiskFlag,
} from "@/lib/defense/financial-defense";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flags = await getFinancialRiskFlags({
      entityType: searchParams.get("entityType") ?? undefined,
      entityId: searchParams.get("entityId") ?? undefined,
      flagType: searchParams.get("flagType") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50,
    });
    return Response.json(flags);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get financial risk flags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.resolve === true && body.id) {
      const { id, status, resolvedBy } = body;
      if (status !== "CLEARED" && status !== "CONFIRMED") {
        return Response.json({ error: "status must be CLEARED or CONFIRMED" }, { status: 400 });
      }
      const flag = await resolveFinancialRiskFlag(id, status, resolvedBy ?? "admin");
      return Response.json(flag);
    }
    const { entityType, entityId, flagType, severity, amountCents, payload, createdBy } = body;
    if (!entityType || !entityId || !flagType || !severity) {
      return Response.json(
        { error: "entityType, entityId, flagType, severity required" },
        { status: 400 }
      );
    }
    const flag = await createFinancialRiskFlag({
      entityType,
      entityId,
      flagType,
      severity,
      amountCents,
      payload,
      createdBy,
    });
    return Response.json(flag);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create or resolve risk flag" }, { status: 500 });
  }
}
