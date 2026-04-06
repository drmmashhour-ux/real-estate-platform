import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  type InvestorCrmRecord,
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

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;
  try {
    const investors = await readInvestorsCrm();
    return NextResponse.json({ investors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "read failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const statusRaw = typeof b.status === "string" ? b.status : "not contacted";
  const status: InvestorCrmStatus = isStatus(statusRaw) ? statusRaw : "not contacted";

  const row: InvestorCrmRecord = {
    id: randomUUID(),
    name,
    fund_name: typeof b.fund_name === "string" ? b.fund_name : "",
    type: typeof b.type === "string" ? b.type : "",
    focus: typeof b.focus === "string" ? b.focus : "",
    stage: typeof b.stage === "string" ? b.stage : "",
    location: typeof b.location === "string" ? b.location : "",
    email: typeof b.email === "string" ? b.email : "",
    linkedin: typeof b.linkedin === "string" ? b.linkedin : "",
    source: typeof b.source === "string" ? b.source : "",
    status,
    last_contact_date: typeof b.last_contact_date === "string" ? b.last_contact_date : "",
    next_follow_up: typeof b.next_follow_up === "string" ? b.next_follow_up : "",
    notes: typeof b.notes === "string" ? b.notes : "",
  };

  try {
    const all = await readInvestorsCrm();
    all.push(row);
    await writeInvestorsCrm(all);
    return NextResponse.json({ investor: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
