import { redirect } from "next/navigation";
import { LegalFormWorkspaceClient } from "@/components/forms/LegalFormWorkspaceClient";
import { loadLegalDraftWorkspace } from "@/lib/forms/load-draft-workspace";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set(["BROKER", "ADMIN", "MORTGAGE_BROKER"]);

export default async function LegalFormDraftPage({ params }: { params: Promise<{ draftId: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, id: true },
  });
  if (!user || !BROKER_LIKE.has(user.role)) {
    redirect("/dashboard");
  }

  const { draftId } = await params;
  const draft = await loadLegalDraftWorkspace(draftId, userId, user.role);
  if (!draft) {
    redirect("/dashboard/forms");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <LegalFormWorkspaceClient
        draftId={draftId}
        initialDraft={draft}
        userId={user.id}
        userRole={user.role}
      />
    </div>
  );
}
