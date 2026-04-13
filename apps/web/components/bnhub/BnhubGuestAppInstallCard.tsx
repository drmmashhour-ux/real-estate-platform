"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function BnhubGuestAppInstallCard() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<"idle" | "accepted" | "dismissed">("idle");

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallState(choice.outcome);
    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  }

  return (
    <section className="rounded-3xl border border-premium-gold/20 bg-[radial-gradient(circle_at_top,#241c08,transparent_32%),linear-gradient(180deg,#0d0d0d,#121212)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Install BNHUB guest app</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Keep reservations, alerts, and booking actions on your phone.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Add BNHUB to your home screen for faster access to trips, reservation confirmations, payment details, and notifications.
          </p>
        </div>
        {installEvent ? (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Install app
          </button>
        ) : (
          <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
            {installState === "accepted"
              ? "App installed"
              : installState === "dismissed"
                ? "Install dismissed"
                : "Open in browser or install when supported"}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link href="/bnhub/trips" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-premium-gold/30">
          <p className="text-sm font-semibold text-white">Trips</p>
          <p className="mt-2 text-sm text-slate-400">Follow reservation progress and reminders.</p>
        </Link>
        <Link href="/bnhub/notifications" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-premium-gold/30">
          <p className="text-sm font-semibold text-white">Notifications</p>
          <p className="mt-2 text-sm text-slate-400">View reservation alerts and confirmations in one mobile inbox.</p>
        </Link>
        <Link href="/bnhub/stays" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-premium-gold/30">
          <p className="text-sm font-semibold text-white">Search stays</p>
          <p className="mt-2 text-sm text-slate-400">Book again or open listing details from your phone.</p>
        </Link>
      </div>
    </section>
  );
}
