import { getGuestId } from "@/lib/auth/session";
import { HostListingsPage } from "@/components/host/HostListingsPage";
import { getHostListings } from "@/lib/host";

export const dynamic = "force-dynamic";

export default async function HostListingsManagePage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const listings = await getHostListings(hostId);

  return <HostListingsPage listings={listings} newestListingId={listings[0]?.id} />;
}
