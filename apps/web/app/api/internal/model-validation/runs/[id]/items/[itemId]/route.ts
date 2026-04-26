import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import type { AddValidationItemInput } from "@/modules/model-validation/domain/validation.types";
import { updateItem } from "@/modules/model-validation/infrastructure/validationRepository";
import { requirePlatformAdmin } from "../../../../_auth";

export const dynamic = "force-dynamic";

/** PATCH — update human labels / reviewer fields; recomputes agreement flags (admin). */
export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id: runId, itemId } = await context.params;

  let body: Partial<AddValidationItemInput>;
  try {
    body = (await request.json()) as Partial<AddValidationItemInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const item = await updateItem(prisma, runId, itemId, body);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ id: item.id });
}
