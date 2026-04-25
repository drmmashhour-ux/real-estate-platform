import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { formatAssistantChecklistMessage } from "@/lib/bnhub/host-verification-assistant";
import { notifyHostInAppAndEmail } from "@/lib/bnhub/notify-host-listing-verification";
import { getRequirementsForListingId } from "@/lib/bnhub/verification";
import { blockIfDemoWrite } from "@/lib/demo-mode-api";

/**
 * POST — Admin sends in-app + email checklist reminder (assistant-style copy).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = blockIfDemoWrite(request);
  if (blocked) return blocked;

  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdminSurface(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const packed = await getRequirementsForListingId(id);
  if (!packed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const extra = typeof body?.note === "string" ? body.note.trim() : "";

  const assistant = formatAssistantChecklistMessage(packed.row.title, packed.requirements);
  const message = extra ? `${extra}\n\n---\n\n${assistant}` : assistant;

  await notifyHostInAppAndEmail({
    ownerId: packed.row.owner.id,
    ownerEmail: packed.row.owner.email ?? null,
    listingId: id,
    title: "Listing checklist — please complete missing items",
    message,
    actionUrl: `/bnhub/host/listings/${id}/edit`,
    actionLabel: "Complete requirements",
    emailSubject: `Reminder: ${packed.row.title}`,
    metadata: { kind: "bnhub_admin_checklist_nudge", sentBy: userId },
  });

  return NextResponse.json({ ok: true });
}
