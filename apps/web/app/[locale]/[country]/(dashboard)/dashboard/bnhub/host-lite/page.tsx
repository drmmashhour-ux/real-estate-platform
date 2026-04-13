import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { HostShortTermDashboard } from "@/src/modules/bnhub/ui/HostShortTermDashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/bnhub/host-lite");
  return <HostShortTermDashboard hostId={userId} />;
}

