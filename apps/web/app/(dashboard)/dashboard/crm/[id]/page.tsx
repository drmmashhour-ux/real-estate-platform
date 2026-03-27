import { redirect } from "next/navigation";

/** CRM contact detail in-app: broker client profile. */
export default async function DashboardCrmClientAliasPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/dashboard/broker/clients/${encodeURIComponent(id)}`);
}
