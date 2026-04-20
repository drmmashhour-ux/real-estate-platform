import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { initializeExperiment } from "@/modules/autonomy/experiment/experiment-init.service";

export const dynamic = "force-dynamic";

function authorize(req: Request) {
  const expected = process.env.AUTONOMY_EXPERIMENT_SECRET?.trim();
  const header = req.headers.get("x-autonomy-experiment-secret")?.trim();
  if (expected && header === expected) {
    return { ok: true as const };
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const direct = authorize(req);
    if (!direct) {
      const admin = await requireRole("admin");
      if (!admin.ok) return admin.response;
    }

    const body = (await req.json()) as { experimentId?: string };
    if (!body.experimentId) {
      return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
    }

    const result = await initializeExperiment(body.experimentId);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Init failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
