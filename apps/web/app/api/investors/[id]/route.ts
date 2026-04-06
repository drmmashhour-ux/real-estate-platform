import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  type InvestorCrmStatus,
  INVESTOR_CRM_STATUSES,
  readInvestorsCrm,
  writeInvestorsCrm,
} from "@/lib/investors-crm/store";

export const dynamic = "force-dynamic";

function isStatus(s: string): s is InvestorCrmStatus {
  return (INVESTOR_CRM_STATUSES as readonly string[]).includes(s);
}

async function requireAdmin() {
  const uid = await getGuestId();
  if (!uid) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!(await isPlatformAdmin(uid)))
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true as const };
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  try {
    const all = await readInvestorsCrm();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });

    const cur = all[idx]!;
    const next = { ...cur };

    const action = typeof b.action === "string" ? b.action : "";
    if (action === "mark_contacted") {
      next.status = "contacted";
      next.last_contact_date = todayISODate();
    } else if (action === "schedule_follow_up") {
      const d =
        typeof b.next_follow_up === "string" && b.next_follow_up.trim()
          ? b.next_follow_up.trim()
          : new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
      next.next_follow_up = d;
    } else if (action === "move_to_meeting") {
      next.status = "meeting";
      next.last_contact_date = todayISODate();
    } else {
      const str = (k: keyof typeof next) => {
        if (typeof b[k] === "string") (next as Record<string, string>)[k] = b[k] as string;
      };
      str("name");
      str("fund_name");
      str("type");
      str("focus");
      str("stage");
      str("location");
      str("email");
      str("linkedin");
      str("source");
      str("last_contact_date");
      str("next_follow_up");
      str("notes");
      if (typeof b.status === "string" && isStatus(b.status)) next.status = b.status;
    }

    all[idx] = next;
    await writeInvestorsCrm(all);
    return NextResponse.json({ investor: next });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
