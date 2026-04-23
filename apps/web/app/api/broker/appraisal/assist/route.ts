import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getBrokerAppraisalCaseForUser } from "@/lib/appraisal/broker-appraisal-case.service";
import { runAppraisalAssistantPrompt } from "@/lib/appraisal/appraisal-assistant";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  caseId: z.string().min(1),
  question: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await getBrokerAppraisalCaseForUser(body.caseId, auth.user.id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const out = await runAppraisalAssistantPrompt({
    userQuestion: body.question,
    caseTitle: row.title,
    reportNumber: row.reportNumber,
  });

  return NextResponse.json(out);
}
