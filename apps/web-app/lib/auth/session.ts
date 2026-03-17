import { cookies } from "next/headers";

const GUEST_ID_COOKIE = "lecipm_guest_id";

export async function getGuestId(): Promise<string | null> {
  const c = await cookies();
  return c.get(GUEST_ID_COOKIE)?.value ?? null;
}

export function setGuestIdCookie(guestId: string) {
  return {
    name: GUEST_ID_COOKIE,
    value: guestId,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };
}
