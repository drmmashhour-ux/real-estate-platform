import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sybnbFail, sybnbJson, firstZodIssueMessage } from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam } from "@/lib/sybnb/sybnb-api-schemas";
import {
  getReplySuggestions,
  resolveSuggestionLocale,
  toSafeBookingSnapshot,
} from "@/lib/sybnb/chat-suggestions";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Host-only GET: loads last guest message + booking snapshot (no guest/host names in API response),
 * returns rule-based (+ optional AI) suggestions — see {@link getReplySuggestions}.
 */
async function handleChatSuggestionsGET(req: Request): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }

  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  const url = new URL(req.url);
  const bookingIdRaw = url.searchParams.get("bookingId") ?? "";
  const localeRaw = url.searchParams.get("locale") ?? "en";

  const idParsed = sybnbIdParam.safeParse(bookingIdRaw.trim());
  if (!idParsed.success) {
    return sybnbFail(firstZodIssueMessage(idParsed.error), 400);
  }
  const bookingId = idParsed.data;

  const booking = await prisma.sybnbBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestId: true,
      hostId: true,
      status: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guests: true,
    },
  });

  if (!booking) {
    return sybnbFail("not_found", 404);
  }

  if (user.id !== booking.hostId) {
    return sybnbFail("forbidden", 403);
  }

  const lastGuest = await prisma.sybnbMessage.findFirst({
    where: { bookingId, senderId: booking.guestId },
    orderBy: { createdAt: "desc" },
    select: { content: true },
  });

  const locale = resolveSuggestionLocale(localeRaw);
  const snapshot = toSafeBookingSnapshot(booking);

  const { suggestions, source } = await getReplySuggestions({
    lastGuestMessage: lastGuest?.content ?? null,
    booking: snapshot,
    locale,
  });

  return sybnbJson({ suggestions, source });
}

export async function GET(req: Request): Promise<Response> {
  return sybnbApiCatch(() => handleChatSuggestionsGET(req));
}
