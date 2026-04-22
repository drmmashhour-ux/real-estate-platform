import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getResidence } from "@/modules/senior-living/residence.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const residence = await getResidence(id);
    if (!residence) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ residence });
  } catch (e) {
    logError("[api.senior.residences.id]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
