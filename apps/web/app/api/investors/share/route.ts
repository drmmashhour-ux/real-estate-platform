import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import {
  createInvestorShareLink,
  listInvestorShareLinks,
} from "@/modules/investors/investor-share.service";
import type { InvestorShareVisibility } from "@/modules/investors/investor-share.types";

export const dynamic = "force-dynamic";

function visibilityBody(v: unknown): InvestorShareVisibility | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const keys = ["metrics", "narrative", "executionProof", "expansionStory", "risks", "outlook"] as const;
  const out: Partial<InvestorShareVisibility> = {};
  for (const k of keys) {
    if (typeof o[k] !== "boolean") return null;
    out[k] = o[k];
  }
  return out as InvestorShareVisibility;
}

export async function GET() {
  if (!engineFlags.investorShareLinkV1 || !engineFlags.investorDashboardV1) {
    return NextResponse.json({ error: "Investor share links are disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const links = listInvestorShareLinks();
  return NextResponse.json({ links });
}

export async function POST(req: Request) {
  if (!engineFlags.investorShareLinkV1 || !engineFlags.investorDashboardV1) {
    return NextResponse.json({ error: "Investor share links are disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const visibility = visibilityBody(b.visibility);
  if (!visibility) {
    return NextResponse.json({ error: "visibility must include six booleans" }, { status: 400 });
  }
  const publicTitle =
    typeof b.publicTitle === "string" ? b.publicTitle.trim() : "";
  if (!publicTitle || publicTitle.length > 200) {
    return NextResponse.json({ error: "publicTitle required (max 200 chars)" }, { status: 400 });
  }
  const label = typeof b.label === "string" ? b.label.trim().slice(0, 120) : undefined;
  const publicSubtitle =
    typeof b.publicSubtitle === "string" ? b.publicSubtitle.trim().slice(0, 300) : undefined;
  let expiresAt: string | undefined;
  if (b.expiresAt !== undefined && b.expiresAt !== null) {
    if (typeof b.expiresAt !== "string") {
      return NextResponse.json({ error: "expiresAt must be ISO string or omitted" }, { status: 400 });
    }
    const d = new Date(b.expiresAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "expiresAt invalid" }, { status: 400 });
    }
    expiresAt = d.toISOString();
  }
  const windowDays =
    typeof b.windowDays === "number" && Number.isFinite(b.windowDays)
      ? Math.round(b.windowDays)
      : undefined;

  const link = await createInvestorShareLink({
    visibility,
    publicTitle,
    publicSubtitle,
    label,
    expiresAt,
    createdBy: auth.userId,
    windowDays,
  });

  return NextResponse.json({ link });
}
