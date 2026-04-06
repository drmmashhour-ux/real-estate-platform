import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { parseFsboContactBody } from "@/lib/fsbo/validation";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { sendFsboLeadEmailToOwner } from "@/lib/email/fsbo-lead-email";
import { headers } from "next/headers";
import { getPublicAppUrl } from "@/lib/config/public-app-url";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required to contact sellers" }, { status: 401 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const limit = checkRateLimit(`fsbo:contact:${ip}`, { windowMs: 60_000, max: 8 });
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many messages. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseFsboContactBody(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { listingId, name, email, phone, message } = parsed.data;

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: {
      owner: { select: { email: true } },
    },
  });
  if (!listing || !isFsboPubliclyVisible(listing)) {
    return Response.json({ error: "Listing not available" }, { status: 404 });
  }

  await prisma.fsboLead.create({
    data: {
      listingId,
      name,
      email,
      phone,
      message,
    },
  });

  const origin = getPublicAppUrl();
  const ownerInbox = listing.owner.email?.trim();
  if (ownerInbox) {
    void sendFsboLeadEmailToOwner({
      to: ownerInbox,
      listingTitle: listing.title,
      listingId: listing.id,
      leadName: name,
      leadEmail: email,
      leadMessage: message,
      origin,
    });
  }

  return Response.json({ ok: true });
}
