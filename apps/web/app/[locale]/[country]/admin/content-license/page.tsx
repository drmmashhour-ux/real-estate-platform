import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { ContentLicenseAdminClient } from "./ContentLicenseAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminContentLicensePage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    redirect("/admin");
  }
  const theme = getHubTheme("admin");

  return (
    <HubLayout
      title="Admin"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={true}
    >
      <div className="space-y-6">
        <div>
          <Link href="/admin/legal" className="text-sm text-amber-400/90 hover:text-amber-300">
            ← Legal documents
          </Link>
          <h1 className="mt-3 text-xl font-semibold" style={{ color: theme.text }}>
            Content &amp; Usage License
          </h1>
          <p className="mt-1 text-sm opacity-80">
            Control the policy version users must accept for platform content and messaging actions.
          </p>
        </div>
        <ContentLicenseAdminClient />
      </div>
    </HubLayout>
  );
}
