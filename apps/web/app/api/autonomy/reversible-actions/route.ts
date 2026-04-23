import { NextResponse } from "next/server";
import { listReversibleActions } from "@/modules/autonomy/actions/autonomy-rollback.service";

export async function GET() {
  try {
    const actions = await listReversibleActions();
    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Failed to list reversible actions", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
