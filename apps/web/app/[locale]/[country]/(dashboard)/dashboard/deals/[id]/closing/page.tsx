import { redirect } from "next/navigation";

/** Closing coordination uses the same hub — notary + blockers panels. */
export default async function DealClosingAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/deals/${id}/coordination`);
}
