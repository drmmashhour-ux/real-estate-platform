import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { generateDeclarationReviewSummary } from "@/src/modules/seller-declaration-ai/application/generateDeclarationReviewSummary";

export async function GET(_req: Request, context: { params: Promise<{ draftId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const admin = await isPlatformAdmin(userId);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { draftId } = await context.params;
  const summary = await generateDeclarationReviewSummary(draftId);
  if (!summary) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(summary);
}
