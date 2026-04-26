import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { ImmoContactLogsClient } from "../immo-logs/ImmoContactLogsClient";
import { ImmoContactControlSections } from "./ImmoContactControlSections";

export const dynamic = "force-dynamic";

export default async function AdminImmoContactPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/immo-contact");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  return (
    <HubLayout title="ImmoContact" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link href="/admin/dashboard" className="text-sm text-premium-gold hover:underline">
            ← Control center
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-white">ImmoContact — control center</h1>
          <p className="mt-1 text-sm text-slate-400">
            Full contact logs with precise timestamps (local + UTC), workflow flags (action required / handled), optional
            dispute references, and AI-assisted drafts when guests use Gemini polish. Linked deals and commission
            attribution below. Append-only events; admins add notes and close loops. Use{" "}
            <Link href="/admin/timeline" className="text-premium-gold hover:underline">
              global timeline
            </Link>{" "}
            for deep entity history.
          </p>
        </div>
        <ImmoContactControlSections />
        <ImmoContactLogsClient variant="timeline" />
      </div>
    </HubLayout>
  );
}
