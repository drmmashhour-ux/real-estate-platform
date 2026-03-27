import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertDocumentAccess } from "@/src/modules/ai-legal-assistant/tools/_access";
import { getCaseOverview } from "@/src/modules/case-command-center/application/getCaseOverview";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const { documentId } = await context.params;
  if (!(await assertDocumentAccess(documentId, userId))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const data = await getCaseOverview(documentId, userId);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
