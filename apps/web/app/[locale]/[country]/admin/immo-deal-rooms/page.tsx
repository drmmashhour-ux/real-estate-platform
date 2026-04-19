import { redirect } from "next/navigation";

/** Alias for admins/operators — shared UI lives on the dashboard route. */
export default function AdminImmoDealRoomsAliasPage() {
  redirect("/dashboard/immo-deal-rooms");
}
