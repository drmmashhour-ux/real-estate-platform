import { NextResponse } from "next/server";
import { runValidationRules } from "@/modules/turbo-form-drafting/validationRules";
import { getNoticesForDraft } from "@/modules/turbo-form-drafting/noticeBridge";
import { TurboDraftInput } from "@/modules/turbo-form-drafting/types";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const input = (await req.json()) as TurboDraftInput;
    
    const risks = runValidationRules(input);
    const notices = getNoticesForDraft(input, risks);
    const canProceed = !risks.some(r => r.blocking);

    return NextResponse.json({
      risks,
      notices,
      canProceed,
      blockingReasons: risks.filter(r => r.blocking).map(r => r.messageFr)
    });
  } catch (err) {
    console.error("[api:turbo-draft:validate] error", err);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
