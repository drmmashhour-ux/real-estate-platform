import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { addValidationItem } from "@/modules/model-validation/application/addValidationItem";
import type { AddValidationItemInput } from "@/modules/model-validation/domain/validation.types";
import { requirePlatformAdmin } from "../../../_auth";

export const dynamic = "force-dynamic";

type PostBody = AddValidationItemInput & { fillFromEngine?: boolean };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id: runId } = await context.params;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.entityType?.trim() || !body.entityId?.trim()) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }

  try {
    const item = await addValidationItem(prisma, runId, body);
    return NextResponse.json({ id: item.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json({ error: "Entity already in this run" }, { status: 409 });
    }
    if (msg === "Run not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
