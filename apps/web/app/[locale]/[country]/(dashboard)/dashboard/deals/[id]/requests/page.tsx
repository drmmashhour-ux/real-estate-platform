import { redirect } from "next/navigation";

/** Requests live under the unified coordination workspace (same UI surface). */
export default async function DealRequestsAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/deals/${id}/coordination`);
}
