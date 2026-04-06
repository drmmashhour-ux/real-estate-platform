import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { logBooking, logBrokerContact, logMessage, logRevenue } from "@/src/modules/execution/dailyTracker";
import { logConversion, logCrmUserAction } from "@/src/modules/execution/crmBridge";
import { EXECUTION_ACTION_TYPES, type ExecutionActionType } from "@/src/modules/execution/constants";

const ACTION_SET = EXECUTION_ACTION_TYPES as readonly string[];

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as {
    kind?: string;
    count?: number;
    amount?: number;
    userId?: string | null;
    crmType?: string;
  };
  const kind = b.kind ?? "";
  const count = typeof b.count === "number" && b.count > 0 ? Math.floor(b.count) : 1;
  const crm = b.userId ? { userId: b.userId, status: "done" as const } : undefined;

  try {
    switch (kind) {
      case "message":
        await logMessage(count, new Date(), crm);
        break;
      case "broker":
        await logBrokerContact(count, new Date(), crm);
        break;
      case "booking":
        await logBooking(count, new Date(), crm);
        break;
      case "revenue":
        await logRevenue(typeof b.amount === "number" ? b.amount : Number(b.amount), new Date());
        break;
      case "crm_action": {
        const t = b.crmType as string;
        if (!b.userId || !ACTION_SET.includes(t)) {
          return Response.json({ error: "crmType and userId required" }, { status: 400 });
        }
        await logCrmUserAction(t as ExecutionActionType, b.userId);
        break;
      }
      case "conversion": {
        if (!b.userId) return Response.json({ error: "userId required" }, { status: 400 });
        await logConversion(b.userId);
        break;
      }
      default:
        return Response.json({ error: "kind must be message|broker|booking|revenue|crm_action|conversion" }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "log failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
