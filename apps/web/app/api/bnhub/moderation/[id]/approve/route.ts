import { NextRequest } from "next/server";
import { approveListing } from "@/lib/bnhub/verification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const listing = await approveListing(id, body.createdBy);
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to approve listing" }, { status: 500 });
  }
}
