import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { cancelInvoice } from "@/modules/finance/services/invoice-service";
import { canIssueInvoice } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canIssueInvoice(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await cancelInvoice(ctx.tenantId, id);
  return NextResponse.json({ ok: true });
}
