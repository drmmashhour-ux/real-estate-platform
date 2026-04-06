import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { createInvestor } from "@/src/modules/fundraising/pipeline";
import { isFundraisingStage } from "@/src/modules/fundraising/constants";

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
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid body" }, { status: 400 });
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name : "";
  const email = typeof b.email === "string" ? b.email : "";
  if (!name.trim() || !email.trim()) {
    return Response.json({ error: "name and email required" }, { status: 400 });
  }
  const firm = typeof b.firm === "string" ? b.firm : undefined;
  const notes = typeof b.notes === "string" ? b.notes : undefined;
  const stageRaw = typeof b.stage === "string" ? b.stage : undefined;
  if (stageRaw && !isFundraisingStage(stageRaw)) {
    return Response.json({ error: "invalid stage" }, { status: 400 });
  }

  try {
    const row = await createInvestor({
      name,
      email,
      firm,
      notes,
      stage: stageRaw && isFundraisingStage(stageRaw) ? stageRaw : undefined,
    });
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
