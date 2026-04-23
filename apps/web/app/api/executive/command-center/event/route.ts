import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const ALLOWED = new Set([
  "COMMAND_CENTER_OPENED",
  "COMMAND_CENTER_QUICK_ACTION",
  "COMMAND_CENTER_COPILOT_OPENED",
]);

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  await recordAuditEvent({
    actorUserId: admin.userId,
    action,
    payload: {
      href: typeof body.href === "string" ? body.href : undefined,
      label: typeof body.label === "string" ? body.label : undefined,
    },
  });

  return NextResponse.json({ success: true });
}
