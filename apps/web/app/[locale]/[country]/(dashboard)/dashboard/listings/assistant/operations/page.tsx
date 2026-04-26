import Link from "next/link";
import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { ListingAssistantOperationsClient } from "@/components/listing-assistant/ListingAssistantOperationsClient";

export const dynamic = "force-dynamic";

export default async function ListingAssistantOperationsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?returnUrl=${encodeURIComponent(`${prefix}/dashboard/listings/assistant/operations`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    redirect(`${prefix}/dashboard/broker`);
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Listing Assistant · Operations
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Drafts, readiness & outcomes</h1>
          </div>
          <Link
            href={`${prefix}/dashboard/listings/assistant`}
            className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            ← Back to assistant
          </Link>
        </div>
      </div>
      <ListingAssistantOperationsClient />
    </main>
  );
}
