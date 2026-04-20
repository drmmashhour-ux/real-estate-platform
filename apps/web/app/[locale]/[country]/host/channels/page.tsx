import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";

export default async function HostChannelsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/host/channels");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-white">
      <div>
        <h1 className="text-xl font-bold">Channel Manager</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Connect calendars and OTAs. BNHub remains the inventory source of truth; sync jobs log every push attempt.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/bnhub/host/channel-manager"
          className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
        >
          Connect Airbnb
        </Link>
        <Link
          href="/bnhub/host/channel-manager"
          className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
        >
          Connect Booking
        </Link>
        <Link
          href="/bnhub/host/channel-manager"
          className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
        >
          Connect Vrbo
        </Link>
        <Link
          href="/bnhub/host/channel-manager"
          className="inline-block rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-400"
        >
          iCal + full settings
        </Link>
        <Link
          href="/host/channels/ics"
          className="inline-block rounded-lg border border-amber-600/50 px-4 py-2 text-sm text-amber-200 hover:border-amber-400"
        >
          ICS import / export (new)
        </Link>
      </div>

      <p className="text-xs text-zinc-500">
        Airbnb / Booking.com / Vrbo API connectors use the same architecture — OAuth and partner endpoints will plug into{" "}
        <code className="rounded bg-zinc-900 px-1 py-0.5">modules/channel-manager/providers</code>.
      </p>
    </div>
  );
}
