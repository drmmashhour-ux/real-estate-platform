import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const providers = await prisma.bnhubServiceProviderProfile.findMany({ take: 50 });
  return (
    <HubLayout title="BNHUB providers" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/services" className="text-sm text-amber-400">
          ← Services
        </Link>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {providers.map((p) => (
            <li key={p.id} className="p-3 text-sm">
              {p.displayName} · {p.providerType} · {p.verificationStatus}
            </li>
          ))}
        </ul>
      </div>
    </HubLayout>
  );
}
