import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { revokeInvestorShareLink } from "@/modules/investors/investor-share.service";

export const dynamic = "force-dynamic";

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
  const id =
    body && typeof body === "object" && typeof (body as { id?: unknown }).id === "string"
      ? (body as { id: string }).id.trim()
      : "";
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ok = revokeInvestorShareLink(id);
  if (!ok) {
    return NextResponse.json({ error: "Could not revoke link" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
