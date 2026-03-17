import { NextResponse } from "next/server";

const GUEST_ID_COOKIE = "lecipm_guest_id";

/** POST /api/auth/logout — Clear session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GUEST_ID_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res;
}
