import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getScriptByCategory } from "@/modules/sales-scripts/sales-script.service";
import type {
  SalesScriptCategory,
  ScriptAudience,
  ScriptContext,
} from "@/modules/sales-scripts/sales-script.types";
import { getVariantMetadata } from "@/modules/sales-scripts/sales-script-variants.service";

export const dynamic = "force-dynamic";

const BROKER_CATS = new Set<string>([
  "cold_call_broker",
  "follow_up_broker",
  "demo_booking_broker",
  "closing_broker",
]);

const INVESTOR_CATS = new Set<string>([
  "cold_call_investor",
  "pitch_investor",
  "follow_up_investor",
  "closing_investor",
]);

function isCategory(audience: ScriptAudience, cat: string): cat is SalesScriptCategory {
  if (audience === "BROKER") return BROKER_CATS.has(cat);
  return INVESTOR_CATS.has(cat);
}

/**
 * GET ?audience=BROKER|INVESTOR&category=...&contactName=&region=&performanceTier=&previousInteraction=
 */
export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const audience = (url.searchParams.get("audience") ?? "BROKER") as ScriptAudience;
  const category = url.searchParams.get("category") ?? "";
  if (audience !== "BROKER" && audience !== "INVESTOR") {
    return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
  }
  if (!category || !isCategory(audience, category)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }

  const ctx: ScriptContext = {
    audience,
    contactName: url.searchParams.get("contactName") ?? undefined,
    region: url.searchParams.get("region") ?? undefined,
    performanceTier: (url.searchParams.get("performanceTier") as ScriptContext["performanceTier"]) ?? undefined,
    previousInteraction:
      (url.searchParams.get("previousInteraction") as ScriptContext["previousInteraction"]) ?? undefined,
  };

  try {
    const script = getScriptByCategory(category, ctx);
    const variantKey = getVariantMetadata(ctx);
    return NextResponse.json({ ok: true, variantKey, script });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "script_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
