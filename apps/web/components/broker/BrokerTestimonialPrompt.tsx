"use client";

import * as React from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function BrokerTestimonialPrompt() {
  const [show, setShow] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [quote, setQuote] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/broker/testimonial-prompt", { credentials: "include" });
        const j = (await res.json()) as { show?: boolean };
        if (res.ok && j.show) setShow(true);
      } catch {
        /* noop */
      }
    })();
  }, []);

  async function dismiss() {
    try {
      await fetch("/api/broker/testimonial-prompt/dismiss", { method: "POST", credentials: "include" });
    } catch {
      /* noop */
    }
    setShow(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/broker/testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, city, quote, rating }),
      });
      const j = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setErr(j.error ?? "Could not save");
        return;
      }
      setSubmitted(true);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <Modal
      isOpen
      onClose={submitted ? () => setShow(false) : dismiss}
      title={submitted ? "Thank you" : "How was your experience?"}
    >
      <div className="p-5">
        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">Thanks — we may show your quote on our site after a quick review.</p>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-200/90">Invite another broker</p>
              <p className="mt-1 text-sm text-zinc-200">Share the love — refer a colleague and you can get priority leads.</p>
              <Button variant="goldPrimary" asChild className="mt-3 w-full text-[10px] font-black tracking-widest">
                <Link href="/dashboard/outreach" onClick={() => setShow(false)}>
                  Open referral & outreach hub
                </Link>
              </Button>
            </div>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setShow(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-zinc-400">A short line helps other brokers trust LECIPM. It only takes a moment.</p>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500">Your name (public)</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-zinc-900" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500">City / region (public)</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} required className="bg-zinc-900" placeholder="e.g. Montréal" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-zinc-500">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1 text-amber-400 hover:scale-110"
                    aria-label={`${n} stars`}
                  >
                    <Star className={`h-7 w-7 ${n <= rating ? "fill-current" : "text-zinc-600"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500">Your words</label>
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                required
                maxLength={2000}
                placeholder="e.g. Helped me focus on the right deals instantly."
              />
            </div>
            {err ? <p className="text-sm text-red-400">{err}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" variant="goldPrimary" className="flex-1" disabled={loading}>
                {loading ? "Sending…" : "Submit"}
              </Button>
              <Button type="button" variant="ghost" onClick={dismiss} className="flex-1">
                <X className="mr-1 h-4 w-4" />
                Not now
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
