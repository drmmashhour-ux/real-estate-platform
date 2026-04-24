import { NextResponse } from "next/server";
import { explainClause } from "@/modules/quebec-trust-hub/explainLikeOaciq";
import { logTrustHubEvent } from "@/modules/quebec-trust-hub/trustHubAuditLogger";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(req: Request) {
  const auth = await requireUser();
  const userId = auth.ok ? auth.user.id : undefined;

  try {
    const { sectionKey, clauseText, draftId } = await req.json();
    const explanation = explainClause(sectionKey, clauseText);

    if (draftId) {
      await logTrustHubEvent({
        draftId,
        userId,
        eventKey: "clause_explained",
        severity: "INFO",
        payload: { sectionKey }
      });
    }

    return NextResponse.json(explanation);
  } catch (err) {
    return NextResponse.json({ error: "Failed to explain clause" }, { status: 500 });
  }
}
