import { NextResponse } from "next/server";
import { getDomainKillSwitches } from "@/modules/autonomy/services/autonomy-kill-switch.service";

export async function GET() {
  try {
    const statuses = await getDomainKillSwitches();
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Failed to get kill switches", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
