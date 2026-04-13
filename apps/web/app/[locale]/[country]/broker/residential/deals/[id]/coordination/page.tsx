import { redirect } from "next/navigation";

/** Canonical broker deal coordination lives on the dashboard deal route. */
export default async function BrokerResidentialCoordinationAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/deals/${id}/coordination`);
}
