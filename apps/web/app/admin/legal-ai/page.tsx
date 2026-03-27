import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { LegalAiMonitorClient } from "./LegalAiMonitorClient";
import { DraftEditor } from "@/src/modules/ai-drafting/ui/DraftEditor";
import { listDraftTemplates } from "@/src/modules/ai-drafting/templates/templateEngine";

export const dynamic = "force-dynamic";

export default async function AdminLegalAiPage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    redirect("/admin");
  }
  const theme = getHubTheme("admin");
  const templates = listDraftTemplates();

  return (
    <HubLayout
      title="Admin"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={true}
    >
      <div className="space-y-6">
        <div>
          <Link href="/admin/content-license" className="text-sm text-amber-400/90 hover:text-amber-300">
            ← Content license
          </Link>
          <h1 className="mt-3 text-xl font-semibold" style={{ color: theme.text }}>
            AI legal monitor
          </h1>
          <p className="mt-1 text-sm opacity-80">
            Content-rule signals, legal-context AI audit trail, and an aggregated Legal Risk Report. Not a substitute for
            counsel.
          </p>
        </div>
        <LegalAiMonitorClient />
        <section className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-lg font-semibold text-white">AI Drafting Assistant</h2>
          <p className="text-sm text-slate-400">
            Template-first drafting with constrained AI suggestions and deterministic validation.
          </p>
          <DraftEditor templates={templates} />
        </section>
      </div>
    </HubLayout>
  );
}
