import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { ContractLeaseClient } from "./contract-lease-client";

export const dynamic = "force-dynamic";

export default async function ContractLeasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getGuestId();
  if (!userId) {
    redirect(`/auth/login?next=${encodeURIComponent(`/contracts/${id}`)}`);
  }

  return <ContractLeaseClient contractId={id} />;
}
