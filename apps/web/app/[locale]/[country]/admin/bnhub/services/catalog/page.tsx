import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  return (
    <HubLayout title="BNHUB catalog" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/services" className="text-sm text-amber-400">
          ← Services hub
        </Link>
        <p className="text-sm text-zinc-500">
          Use the main services admin for catalog toggles; this route is reserved for split UX.
        </p>
        <Link href="/admin/bnhub/services" className="text-amber-400 underline">
          Open catalog admin
        </Link>
      </div>
    </HubLayout>
  );
}
