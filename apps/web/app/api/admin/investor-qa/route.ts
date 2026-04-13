import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { createInvestorQA, isInvestorQACategory, isInvestorQADifficulty, listInvestorQA } from "@/lib/admin/investor-qa";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const cat = searchParams.get("category") ?? "all";
  const category =
    cat === "all" || !cat ? "all" : isInvestorQACategory(cat) ? cat : null;
  if (category === null) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const items = await listInvestorQA({ q, category });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question : "";
  const answer = typeof body.answer === "string" ? body.answer : "";
  const category = typeof body.category === "string" && isInvestorQACategory(body.category) ? body.category : null;
  if (!question.trim() || !answer.trim() || !category) {
    return NextResponse.json({ error: "question, answer, and valid category required" }, { status: 400 });
  }

  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : undefined;
  const difficulty =
    typeof body.difficulty === "string" && isInvestorQADifficulty(body.difficulty) ? body.difficulty : undefined;
  const row = await createInvestorQA({ question, answer, category, sortOrder, difficulty });
  return NextResponse.json({ item: row });
}
