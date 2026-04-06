import { NextRequest } from "next/server";
import {
  generateTravelShoppingHints,
  type TravelShoppingMode,
} from "@/lib/bnhub/travel-shopping-hints";

function isMode(x: unknown): x is TravelShoppingMode {
  return x === "flight" || x === "package";
}

/** Educational hints from user-provided context only — no live fare lookups. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      mode?: unknown;
      routeOrTripSummary?: unknown;
      pastedNotes?: unknown;
    };
    const mode = isMode(body.mode) ? body.mode : "flight";
    const routeOrTripSummary =
      typeof body.routeOrTripSummary === "string" ? body.routeOrTripSummary : "";
    const pastedNotes = typeof body.pastedNotes === "string" ? body.pastedNotes : undefined;

    if (!routeOrTripSummary.trim()) {
      return Response.json({ error: "routeOrTripSummary required" }, { status: 400 });
    }

    const result = await generateTravelShoppingHints({
      mode,
      routeOrTripSummary,
      pastedNotes,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to generate hints" }, { status: 500 });
  }
}
