"use client";

import Link from "next/link";
import { AutonomousSuggestionsPanel } from "@/components/copilot/AutonomousSuggestionsPanel";

/**
 * Buy-box / saved-search hub entry — proactive suggestions + deep links.
 */
export default function BrokerBuyBoxPage() {
  return (
    <div className="min-h-screen space-y-8 bg-zinc-950 p-6 text-white">
      <div>
        <h1 className="text-3xl font-bold text-[#D4AF37]">Buy box & saved searches</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Tune alerts and saved criteria. Proactive suggestions below use your behavior signals (repeat searches, deal
          views, portfolio revisits).
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/broker/buybox" className="text-[#D4AF37] underline-offset-4 hover:underline">
            AI Buy Box Engine →
          </Link>
          <Link href="/dashboard/broker/saved-searches" className="text-[#D4AF37] underline-offset-4 hover:underline">
            Saved searches →
          </Link>
          <Link href="/dashboard/broker/watchlist" className="text-[#D4AF37] underline-offset-4 hover:underline">
            Watchlist →
          </Link>
          <Link href="/dashboard/broker/alerts" className="text-[#D4AF37] underline-offset-4 hover:underline">
            Alert Center →
          </Link>
          <Link href="/dashboard/broker/digest" className="text-[#D4AF37] underline-offset-4 hover:underline">
            Morning briefing →
          </Link>
          <Link
            href="/dashboard/broker/portfolio/autopilot"
            className="text-[#D4AF37] underline-offset-4 hover:underline"
          >
            Portfolio autopilot →
          </Link>
        </div>
      </div>

      <AutonomousSuggestionsPanel ownerType="solo_broker" autoGenerate />
    </div>
  );
}
