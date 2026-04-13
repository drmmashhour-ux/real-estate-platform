import Link from "next/link";
import { TrashContent } from "./trash-content";

export const dynamic = "force-dynamic";

export default function StorageTrashPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/billing"
          className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          ← Back to billing
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Trash</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Soft-deleted files. Restore within 30 days before permanent deletion. Legal, invoice, and compliance files are never auto-deleted.
        </p>
        <TrashContent />
      </div>
    </main>
  );
}
