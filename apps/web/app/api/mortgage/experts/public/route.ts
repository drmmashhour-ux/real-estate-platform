import { NextResponse } from "next/server";
import { getPublicMortgageExpertsList } from "@/modules/mortgage/services/public-experts";

export const dynamic = "force-dynamic";

/** Active experts for public /mortgage and /experts marketplace */
export async function GET() {
  try {
    const experts = await getPublicMortgageExpertsList();
    return NextResponse.json({ experts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load experts" }, { status: 500 });
  }
}
