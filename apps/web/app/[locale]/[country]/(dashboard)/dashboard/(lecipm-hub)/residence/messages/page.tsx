import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ResidenceMessagesPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-zinc-900">Messages</h1>
      <p className="mt-3 max-w-xl text-sm text-zinc-600">
        Conversations run in your platform inbox — same thread list for all hubs, opened from here.
      </p>
      <Link
        href={`${base}/messages`}
        className="mt-6 inline-flex rounded-lg border border-amber-700/40 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
      >
        Open inbox
      </Link>
    </div>
  );
}
