import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { CONTRACTOR_WORK_DISCLAIMER } from "@/modules/contractors/contractor.model";
import { createGreenQuoteRequest } from "@/modules/contractors/contractor.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projectDescription = typeof body.projectDescription === "string" ? body.projectDescription : "";
  if (projectDescription.trim().length < 8) {
    return NextResponse.json({ error: "Describe your project (at least a few words)." }, { status: 400 });
  }

  const rawHints = body.upgradeHints;
  const upgradeHints = Array.isArray(rawHints)
    ? rawHints.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
    : [];

  const contractorId = typeof body.contractorId === "string" ? body.contractorId : undefined;
  const region = typeof body.region === "string" ? body.region : undefined;

  const userId = await getGuestId();

  const created = await createGreenQuoteRequest({
    userId,
    contractorId: contractorId ?? null,
    projectDescription,
    upgradeHints,
    region,
  });

  return NextResponse.json({
    id: created.id,
    ok: true,
    disclaimer: CONTRACTOR_WORK_DISCLAIMER,
    message: "Request recorded — a professional may follow up subject to availability; LECIPM does not guarantee response times.",
  });
}
