import Link from "next/link";
import { CopyInviteLinkButton } from "./CopyInviteLinkButton";

export default function Landing() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">Find smarter real estate deals</h1>

      <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
        AI-powered listings, better pricing, and verified properties.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/search"
          className="rounded-xl bg-black px-6 py-3 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Explore listings
        </Link>

        <Link href="/onboarding" className="rounded-xl border border-zinc-300 px-6 py-3 text-zinc-900 dark:border-zinc-600 dark:text-zinc-100">
          List your property
        </Link>
      </div>

      <p className="mt-6 text-sm text-red-500 dark:text-red-400">🚀 Only 100 early user spots available</p>

      <CopyInviteLinkButton />
    </main>
  );
}
