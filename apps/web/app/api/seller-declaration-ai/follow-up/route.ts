import { NextResponse } from "next/server";
import { requireSellerOrAdminForListing } from "@/app/api/seller-declaration-ai/_auth";
import { generateFollowUpQuestions } from "@/src/modules/seller-declaration-ai/application/generateFollowUpQuestions";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "");
  const draftId = String(body.draftId ?? "");
  const sectionKey = String(body.sectionKey ?? "");
  const currentAnswer = String(body.currentAnswer ?? "");
  const currentDraft = (body.currentDraft ?? {}) as Record<string, unknown>;

  if (!listingId || !draftId || !sectionKey) return NextResponse.json({ error: "listingId, draftId, sectionKey required" }, { status: 400 });
  const auth = await requireSellerOrAdminForListing(listingId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const result = await generateFollowUpQuestions({ sectionKey, currentAnswer, currentDraft, draftId, actorUserId: auth.userId! });
  return NextResponse.json(result);
}
