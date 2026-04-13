import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { ClientDocumentPage } from "@/src/modules/client-trust-experience/ui/ClientDocumentPage";

export const dynamic = "force-dynamic";

export default async function ClientDocumentRoutePage({ params }: { params: Promise<{ documentId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const { documentId } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 text-white">
      <ClientDocumentPage documentId={documentId} />
    </main>
  );
}
