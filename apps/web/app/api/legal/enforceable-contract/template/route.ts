import { NextRequest, NextResponse } from "next/server";
import { getEnforceableTemplate, type EnforceableTemplateKind } from "@/lib/legal/enforceable-contract-templates";

export const dynamic = "force-dynamic";

const KINDS = new Set<string>(["buyer", "seller", "rental", "shortTerm", "broker"]);

/**
 * GET — template body for `ContractSign` (public text; signing still requires auth).
 */
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind") ?? "";
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const tpl = getEnforceableTemplate(kind as EnforceableTemplateKind);
  return NextResponse.json(tpl);
}
