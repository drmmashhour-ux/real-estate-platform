import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getGuestId } from "@/lib/auth/session";
import { listSocialAccountsSafe } from "@/lib/content-automation/social-accounts";
import { SocialConnectionsClient } from "./social-connections-client";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await getGuestId();
  const sp = await searchParams;
  let accounts: Awaited<ReturnType<typeof listSocialAccountsSafe>> = [];
  if (userId) {
    try {
      accounts = await listSocialAccountsSafe(userId);
    } catch {
      accounts = [];
    }
  }
  const serialized = accounts.map((a) => ({
    ...a,
    expiresAt: a.expiresAt?.toISOString() ?? null,
    lastSyncAt: a.lastSyncAt?.toISOString() ?? null,
  }));

  return (
    <HubLayout title="Social connections" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 text-white">
        <div>
          <h1 className="font-serif text-2xl text-amber-400">Social &amp; schedulers</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Connect Instagram Business, Facebook Pages (Meta), and Buffer for BNHub content automation. Tokens stay on the
            server and are encrypted at rest.
          </p>
        </div>
        <SocialConnectionsClient initialAccounts={serialized} searchParams={sp} />
      </div>
    </HubLayout>
  );
}
