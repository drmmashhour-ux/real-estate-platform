/**
 * GET /api/config — Public config (e.g. phone for Call Us). Server-only env.
 */
import { NextResponse } from "next/server";
import { getPhoneNumber, getPhoneTelLink, hasPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET() {
  const phoneNumber = getPhoneNumber();
  const phoneTelLink = getPhoneTelLink();
  return NextResponse.json({
    phoneNumber: hasPhone() ? phoneNumber : "",
    phoneTelLink: hasPhone() ? phoneTelLink : "",
    hasPhone: hasPhone(),
  });
}
