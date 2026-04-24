import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** @deprecated Use `GET /api/compliance/check/[listingId]` for listing-scoped OACIQ brokerage readiness. */
export async function GET() {
  return NextResponse.json(
    {
      error: "listingId required",
      hint: "GET /api/compliance/check/:listingId",
    },
    { status: 400 },
  );
}
