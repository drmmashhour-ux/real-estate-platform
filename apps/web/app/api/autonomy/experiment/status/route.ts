import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["draft", "running", "paused", "completed"]);

function authorize(req: Request) {
  const expected = process.env.AUTONOMY_EXPERIMENT_SECRET?.trim();
  const header = req.headers.get("x-autonomy-experiment-secret")?.trim();
  if (expected && header === expected) {
    return { ok: true as const };
  }
  return null;
}

/**
 * Manual stop / resume: set `paused` to stop holdout gating, `running` to resume, `completed` to end.
 * Reversible while not complete (re-`running` re-enables the experiment gate for matching actions).
 */
export async function POST(req: Request) {
  try {
    const direct = authorize(req);
    if (!direct) {
      const admin = await requireRole("admin");
      if (!admin.ok) return admin.response;
    }

    const body = (await req.json()) as { experimentId?: string; status?: string; endDate?: string | null };
    if (!body.experimentId) {
      return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
    }
    if (!body.status || !STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: "status must be draft | running | paused | completed" },
        { status: 400 }
      );
    }

    const row = await prisma.autonomyExperiment.update({
      where: { id: body.experimentId },
      data: {
        status: body.status,
        ...(body.status === "completed"
          ? { endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : new Date()) : new Date() }
          : {}),
      },
    });

    await prisma.autonomyEventLog.create({
      data: {
        scopeType: row.scopeType,
        scopeId: row.scopeId,
        eventType: "experiment_status",
        message: `Autonomy experiment status set to ${body.status}`,
        meta: { experimentId: row.id },
      },
    });

    return NextResponse.json({ success: true, experiment: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
