import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { WatchlistPage } from "@/src/modules/watchlist-alerts/ui/WatchlistPage";

export const dynamic = "force-dynamic";

export default async function WatchlistRoutePage() {
  await requireAuthenticatedUser();
  return <WatchlistPage />;
}
