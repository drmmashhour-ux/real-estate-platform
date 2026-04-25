import { NextRequest, NextResponse } from "next/server";
import { explainClause } from "../../../../modules/quebec-trust-hub/explainLikeOaciq";
import { logTrustHubEvent } from "../../../../modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: NextRequest) {
  try {
    const { sectionKey, clauseText, draftId, userId } = await req.json();
    
    const explanation = explainClause({ sectionKey, clauseText });

    if (draftId) {
      await logTrustHubEvent({
        draftId,
        userId: userId,
        eventKey: "clause_explained",
        payload: { sectionKey },
      });
    }

    return NextResponse.json(explanation);
  } catch (error: any) {
    console.error("[EXPLAIN_CLAUSE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
