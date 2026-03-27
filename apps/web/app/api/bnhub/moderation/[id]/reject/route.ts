import { NextRequest } from "next/server";
import { rejectListing } from "@/lib/bnhub/verification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const reason = body?.reason ?? "Does not meet verification criteria.";
    if (!reason || typeof reason !== "string") {
      return Response.json({ error: "reason required" }, { status: 400 });
    }
    const listing = await rejectListing(id, reason.trim(), body.createdBy);
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to reject listing" }, { status: 500 });
  }
}
