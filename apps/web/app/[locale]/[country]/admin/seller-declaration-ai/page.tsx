import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { SellerDeclarationAiClient } from "./sellerDeclarationAiClient";

export const dynamic = "force-dynamic";

export default async function SellerDeclarationAiPage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  return (
    <HubLayout title="Admin" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={true}>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Seller Declaration AI</h1>
        <p className="text-sm text-slate-400">Template-first declaration drafting with controlled AI assistance and deterministic validation.</p>
        <SellerDeclarationAiClient />
      </div>
    </HubLayout>
  );
}
