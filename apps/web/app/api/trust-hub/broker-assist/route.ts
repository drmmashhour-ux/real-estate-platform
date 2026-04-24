import { NextResponse } from "next/server";
import { requestBrokerAssist } from "@/modules/quebec-trust-hub/brokerAssistRouter";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { draftId, reasonFr } = await req.json();
    const assist = await requestBrokerAssist({ draftId, userId: auth.user.id, reasonFr });
    return NextResponse.json(assist);
  } catch (err) {
    return NextResponse.json({ error: "Failed to request broker assist" }, { status: 500 });
  }
}
