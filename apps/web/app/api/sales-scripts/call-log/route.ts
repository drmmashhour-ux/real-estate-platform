import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { logSalesCall } from "@/modules/sales-scripts/sales-script-tracking.service";
import type {
  SalesCallOutcome,
  SalesScriptCategory,
  ScriptAudience,
} from "@/modules/sales-scripts/sales-script.types";

export const dynamic = "force-dynamic";

const OUTCOMES = new Set<SalesCallOutcome>(["INTERESTED", "DEMO", "CLOSED", "LOST", "NO_ANSWER"]);

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: {
    contactId?: string | null;
    audience?: ScriptAudience;
    scriptCategory?: SalesScriptCategory;
    variantKey?: string;
    outcome?: SalesCallOutcome;
    objectionsEncountered?: string[];
    notes?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const audience = body.audience;
  const scriptCategory = body.scriptCategory;
  const outcome = body.outcome;

  if (audience !== "BROKER" && audience !== "INVESTOR") {
    return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
  }
  if (!scriptCategory?.trim()) {
    return NextResponse.json({ error: "script_category_required" }, { status: 400 });
  }
  if (!outcome || !OUTCOMES.has(outcome)) {
    return NextResponse.json({ error: "invalid_outcome" }, { status: 400 });
  }

  try {
    const row = await logSalesCall({
      contactId: body.contactId ?? null,
      audience,
      scriptCategory,
      variantKey: typeof body.variantKey === "string" ? body.variantKey : "default",
      outcome,
      objectionsEncountered: Array.isArray(body.objectionsEncountered) ? body.objectionsEncountered : undefined,
      notes: body.notes ?? null,
      performedByUserId: auth.userId,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "log_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
