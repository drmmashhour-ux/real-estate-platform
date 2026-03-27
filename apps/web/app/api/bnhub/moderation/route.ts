import { getListingsPendingVerification } from "@/lib/bnhub/verification";

export async function GET() {
  try {
    const listings = await getListingsPendingVerification();
    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch moderation queue" }, { status: 500 });
  }
}
