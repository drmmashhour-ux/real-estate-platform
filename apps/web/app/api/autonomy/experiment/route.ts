import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { createDraftAutonomyExperiment } from "@/modules/autonomy/experiment/experiment-crud.service";

export const dynamic = "force-dynamic";

/** Create a draft autonomy holdout experiment (admin only). Start with low treatment % (default 15%). */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      name?: string;
      scopeType?: string;
      scopeId?: string;
      domain?: string;
      signalKey?: string;
      actionType?: string;
      trafficSplit?: number;
      startDate?: string;
      endDate?: string | null;
    };

    if (
      !body.name ||
      !body.scopeType ||
      !body.scopeId ||
      !body.domain ||
      body.signalKey === undefined ||
      !body.actionType ||
      !body.startDate
    ) {
      return NextResponse.json(
        {
          error:
            "name, scopeType, scopeId, domain, signalKey, actionType, startDate (ISO) are required",
        },
        { status: 400 },
      );
    }

    const row = await createDraftAutonomyExperiment({
      name: body.name,
      scopeType: body.scopeType,
      scopeId: body.scopeId,
      domain: body.domain,
      signalKey: body.signalKey,
      actionType: body.actionType,
      trafficSplit: body.trafficSplit,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
    });

    return NextResponse.json({ success: true, experiment: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
