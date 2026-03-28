"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

/**
 * Product demo hub — guided tours run inside the authenticated app (staging / demo mode).
 */
export default function DemoHubPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <AnimatedReveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Product demo</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-white">Experience the platform</h1>
        <p className="mt-4 text-slate-400">
          Choose a guided path. The full interactive tour runs inside the authenticated app (staging or when demo
          mode is enabled). This page sets your preference and sends you to sign in if needed.
        </p>
        <ul className="mt-8 list-inside list-disc space-y-2 text-sm text-slate-400">
          <li>Standard tour — CRM, offers, contracts, documents, messaging, finance.</li>
          <li>Investor tour — platform breadth, integration, finance & oversight story.</li>
        </ul>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black hover:brightness-110"
            onClick={() => {
              try {
                localStorage.setItem("lecipm_demo_tour_id", "standard_user_tour");
                localStorage.setItem("lecipm_demo_pending_autostart", "1");
                localStorage.removeItem("lecipm_demo_autostart_done");
              } catch {
                /* ignore */
              }
              router.push("/auth/login?next=/dashboard/real-estate");
            }}
          >
            Launch standard demo
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-premium-gold/50"
            onClick={() => {
              try {
                localStorage.setItem("lecipm_demo_tour_id", "investor_tour");
                localStorage.setItem("lecipm_demo_pending_autostart", "1");
                localStorage.removeItem("lecipm_demo_autostart_done");
              } catch {
                /* ignore */
              }
              router.push("/auth/login?next=/dashboard/real-estate?demoTour=investor");
            }}
          >
            Launch investor demo
          </button>
          <Link
            href="/#cta"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-slate-300 hover:text-white"
          >
            Request access
          </Link>
          <Link
            href="/demo/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm text-slate-400 hover:text-white"
          >
            Open demo dashboard
          </Link>
        </div>
        <p className="mt-8 text-xs text-slate-600">
          Demo environments may use sample data only — no legal or payment finality is implied.
        </p>
      </AnimatedReveal>
    </div>
  );
}
