import { brokerageOfficeFlags } from "@/config/feature-flags";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { getOfficeRosterWithTeams } from "@/modules/brokerage-office/broker-roster.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "officeManagementV1");
  if ("error" in ctx) return ctx.error;

  const data = await getOfficeRosterWithTeams(ctx.officeId);
  return Response.json({ ...data, access: ctx.access });
}
