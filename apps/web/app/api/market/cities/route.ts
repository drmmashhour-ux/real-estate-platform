import { NextResponse } from "next/server";
import { listDistinctCitiesWithData } from "@/lib/market/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const cities = await listDistinctCitiesWithData();
  return NextResponse.json({ cities });
}
