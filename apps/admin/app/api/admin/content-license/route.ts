import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  ensureContentLicensePolicyRow,
  getRequiredContentLicenseVersion,
  setContentLicensePolicyVersion,
} from "@/lib/legal/content-license-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await ensureContentLicensePolicyRow();
  const currentVersion = await getRequiredContentLicenseVersion();
  return NextResponse.json({ ok: true, currentVersion });
}

/** PATCH body: { currentVersion: string } — bump version to force re-acceptance for all users. */
export async function PATCH(request: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { currentVersion?: string };
  try {
    body = (await request.json()) as { currentVersion?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const nextV = typeof body.currentVersion === "string" ? body.currentVersion.trim() : "";
  if (!nextV || nextV.length > 32) {
    return NextResponse.json({ error: "currentVersion required (max 32 chars)" }, { status: 400 });
  }
  try {
    await setContentLicensePolicyVersion(nextV, userId);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, currentVersion: nextV });
}
