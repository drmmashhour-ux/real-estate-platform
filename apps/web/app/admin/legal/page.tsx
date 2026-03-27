import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { getAllActiveDocuments, getDocumentsByType, getAcceptanceStats } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { AdminLegalClient } from "./AdminLegalClient";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    redirect("/admin");
  }
  const theme = getHubTheme("admin");

  const [activeDocs, stats] = await Promise.all([
    getAllActiveDocuments(),
    getAcceptanceStats(),
  ]);

  const docsByType: Record<string, Awaited<ReturnType<typeof getDocumentsByType>>> = {};
  for (const t of Object.values(LEGAL_DOCUMENT_TYPES)) {
    docsByType[t] = await getDocumentsByType(t);
  }

  const activeDocsSerialized = activeDocs.map((d) => ({
    id: d.id,
    type: d.type,
    version: d.version,
    content: d.content,
    isActive: d.isActive,
    createdAt: d.createdAt.toISOString(),
  }));

  const docsByTypeSerialized: Record<string, { id: string; type: string; version: string; content: string; isActive: boolean; createdAt: string }[]> = {};
  for (const [t, list] of Object.entries(docsByType)) {
    docsByTypeSerialized[t] = list.map((d) => ({
      id: d.id,
      type: d.type,
      version: d.version,
      content: d.content,
      isActive: d.isActive,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  return (
    <HubLayout
      title="Admin"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={true}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Legal documents
          </h1>
          <p className="mt-1 text-sm opacity-80">
            Manage terms, privacy, cookies, host agreement, guest policy, and acceptance stats.
          </p>
        </div>
        <AdminLegalClient
          activeDocs={activeDocsSerialized}
          docsByType={docsByTypeSerialized}
          stats={stats}
        />
      </div>
    </HubLayout>
  );
}
