import { closeDeal } from "@/lib/automation";

export async function POST(req: Request) {
  const body = await req.json();
  const offerId = typeof body.offerId === "string" ? body.offerId : "";
  if (!offerId) {
    return Response.json({ error: "offerId required" }, { status: 400 });
  }
  const offer = await closeDeal(offerId);
  return Response.json(offer);
}
