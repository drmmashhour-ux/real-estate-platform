import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  resolveFraudFlag,
  type ResolveFraudFlagAction,
} from "@/src/modules/fraud/flaggingEngine";

const ACTIONS = new Set<ResolveFraudFlagAction>([
  "reviewed",
  "dismissed",
  "confirmed",
  "actioned",
  "request_verification",
  "trust_review",
  "ranking_penalty_note",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as ResolveFraudFlagAction;
  const notes = typeof body.notes === "string" ? body.notes : undefined;

  if (!action || !ACTIONS.has(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    await resolveFraudFlag(id, auth.userId, action, notes);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
