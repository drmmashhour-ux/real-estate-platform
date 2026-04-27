import Link from "next/link";
import { ConciergePlaybookSections } from "@/components/landing/ConciergePlaybookSections";
import { Premium2kPlaybookSection } from "@/components/landing/Premium2kPlaybookSection";
import { EarlyTractionStrip } from "@/components/landing/EarlyTractionStrip";
import { GrowthRealityList, ManualHelpCallout, RealisticFunnelTable } from "@/components/landing/GrowthLandingSections";
import { DAILY_SOCIAL_POST_TEMPLATE, GROWTH_VALUE_PITCH } from "@/lib/growth/early-trust-content";
import { CopyInviteLinkButton } from "./CopyInviteLinkButton";

export default function Landing() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">{GROWTH_VALUE_PITCH.headline}</h1>

      <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">{GROWTH_VALUE_PITCH.sub}</p>

      <p className="mt-4 text-sm text-green-600 dark:text-green-500">
        ✔ Save money
        <br />
        ✔ Verified listings
        <br />
        ✔ Smart pricing insights
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

      <EarlyTractionStrip className="mt-4" />

      <ManualHelpCallout />
      <RealisticFunnelTable />
      <GrowthRealityList />

      <div className="mx-auto mt-10 max-w-xl text-left">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Daily post (copy &amp; replace [link])</p>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-200">
          {DAILY_SOCIAL_POST_TEMPLATE}
        </pre>
      </div>

      <ConciergePlaybookSections />

      <Premium2kPlaybookSection />

      <CopyInviteLinkButton />
    </main>
  );
}
