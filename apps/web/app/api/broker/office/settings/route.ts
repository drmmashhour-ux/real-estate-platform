import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanManageRoster } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { updateOfficeSettings } from "@/modules/brokerage-office/brokerage-office.service";
import type { OfficeSettingsPatch } from "@/modules/brokerage-office/brokerage-office.types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "officeManagementV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanManageRoster(ctx.access.membership.role)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: OfficeSettingsPatch;
  try {
    body = (await request.json()) as OfficeSettingsPatch;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await updateOfficeSettings(ctx.officeId, ctx.session.userId, body);
  return Response.json(result);
}
