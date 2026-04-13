import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getAllActiveDocuments, getDocumentsByType, getAcceptanceStats } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { prisma } from "@/lib/db";
import { canAccessLegalManagement } from "@/lib/legal-management/admin-auth";
import {
  allRequiredCorporateDocsSigned,
  buildCorporateComplianceRows,
} from "@/lib/legal-management/compliance";
import { AdminLegalClient } from "./AdminLegalClient";
import { LecipmLegalDashboard } from "./LecipmLegalDashboard";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  const guestId = await getGuestId();
  if (!(await canAccessLegalManagement(guestId))) {
    redirect("/admin");
  }

  const theme = getHubTheme("admin");

  const [activeDocs, stats, corporateDocs, structures] = await Promise.all([
    getAllActiveDocuments(),
    getAcceptanceStats(),
    prisma.corporateLegalDocument.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.companyStructure.findMany({ orderBy: { createdAt: "desc" } }),
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

  const docsByTypeSerialized: Record<
    string,
    { id: string; type: string; version: string; content: string; isActive: boolean; createdAt: string }[]
  > = {};
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

  const complianceRows = buildCorporateComplianceRows(corporateDocs);
  const allSigned = allRequiredCorporateDocsSigned(complianceRows);

  const corporateSerialized = corporateDocs.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  }));

  const structuresSerialized = structures.map((s) => ({
    id: s.id,
    entityType: s.entityType,
    jurisdiction: s.jurisdiction,
    createdAt: s.createdAt.toISOString(),
  }));

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
            Legal
          </h1>
          <p className="mt-1 text-sm opacity-80">
            LECIPM legal management (corporate structure & compliance) and platform legal documents.
          </p>
        </div>

        <LecipmLegalDashboard
          documents={corporateSerialized}
          structures={structuresSerialized}
          complianceRows={complianceRows}
          allSigned={allSigned}
        />

        <section className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4">
          <h2 className="text-sm font-semibold text-slate-300">Platform legal documents</h2>
          <p className="mt-1 text-xs text-slate-500">
            Versioned copy shown to users (terms, privacy, BNHUB, etc.).{" "}
            <Link href="/legal/terms" className="text-emerald-400 hover:text-emerald-300">
              Public legal hub
            </Link>
          </p>
          <AdminLegalClient
            activeDocs={activeDocsSerialized}
            docsByType={docsByTypeSerialized}
            stats={stats}
          />
        </section>
      </div>
    </HubLayout>
  );
}
