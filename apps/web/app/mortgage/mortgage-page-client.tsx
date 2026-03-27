"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrokerTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";
import { mortgageCtaLabel, normalizeMortgageAbVariant, type MortgageAbVariant } from "@/lib/revenue/mortgage-ab";
import { AiWriterToolbar } from "@/components/ai/AiWriterToolbar";
import { SpellCheckField } from "@/components/spell/SpellCheckField";
import { MortgageHubAiCard } from "@/components/ai/MortgageHubAiCard";

const AB_COOKIE = "rev_mortgage_cta";

function readAbCookie(): MortgageAbVariant | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${AB_COOKIE}=([^;]*)`));
  if (!m) return null;
  return normalizeMortgageAbVariant(decodeURIComponent(m[1]));
}

function persistAbVariant(v: MortgageAbVariant) {
  document.cookie = `${AB_COOKIE}=${encodeURIComponent(v)}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
}

export type PublicExpert = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  company: string | null;
  title: string | null;
  bio: string | null;
  rating?: number;
  reviewCount?: number;
  totalDeals?: number;
  badges?: string[];
};

/** Query prefill from `/mortgage?from=analyze&purchasePrice=…` (see analyze results CTA). */
export type MortgagePrefill = {
  from?: "analyze";
  purchasePrice?: string;
  purchaseRegion?: string;
};

const GOLD = "#C9A646";

export function MortgagePageClient({
  experts,
  prefill,
}: {
  experts: PublicExpert[];
  prefill?: MortgagePrefill;
}) {
  const primary = experts[0] ?? null;
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [purchasePriceInput, setPurchasePriceInput] = useState(prefill?.purchasePrice ?? "");
  const [purchaseRegionInput, setPurchaseRegionInput] = useState(prefill?.purchaseRegion ?? "");
  const [notes, setNotes] = useState(
    prefill?.from === "analyze"
      ? "I used the LECIPM investment analyzer and want a real approval estimate for my numbers."
      : ""
  );
  const [abVariant, setAbVariant] = useState<MortgageAbVariant>("A");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time A/B cookie hydration on client */
    const existing = readAbCookie();
    if (existing) {
      setAbVariant(existing);
      return;
    }
    const v: MortgageAbVariant = Math.random() < 0.5 ? "A" : "B";
    persistAbVariant(v);
    setAbVariant(v);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      purchasePrice: fd.get("purchasePrice") ? Number(fd.get("purchasePrice")) : undefined,
      downPayment: fd.get("downPayment") ? Number(fd.get("downPayment")) : undefined,
      timeline: String(fd.get("timeline") ?? "").trim(),
      propertyType: String(fd.get("propertyType") ?? "").trim(),
      purchaseRegion: String(fd.get("purchaseRegion") ?? "").trim(),
      buyTimeline: String(fd.get("buyTimeline") ?? "").trim(),
      message: notes.trim() || String(fd.get("message") ?? "").trim(),
      abVariant,
    };
    try {
      const res = await fetch("/api/mortgage/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; marketplace?: boolean };
      if (!res.ok) {
        setStatus("err");
        setMsg(j.error ?? "Could not submit. Try again later.");
        return;
      }
      setStatus("ok");
      setMsg(
        j.marketplace
          ? "Thank you — your request is in our expert queue. A verified specialist will claim it shortly."
          : "Thank you — a mortgage expert will contact you shortly."
      );
      e.currentTarget.reset();
      setPurchasePriceInput("");
      setPurchaseRegionInput("");
      setNotes("");
    } catch {
      setStatus("err");
      setMsg("Network error.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-8 rounded-2xl border border-[#C9A646]/25 bg-[#121212] px-4 py-4 text-center text-sm leading-relaxed text-[#E5E5E5]">
        All mortgage services are handled by verified experts who agree to platform standards and client protection
        policies.
      </p>
      <MortgageHubAiCard purchasePrice={purchasePriceInput} purchaseRegion={purchaseRegionInput} />
      <div className="grid gap-10 lg:grid-cols-2">
        <section id="request-contact" className="scroll-mt-28">
          <h2 className="text-lg font-bold text-white">Request contact</h2>
          <p className="mt-2 text-sm text-[#B3B3B3]">
            FREE — no obligation. We route your request to a{" "}
            <strong className="text-[#E5E5E5]">verified platform mortgage expert</strong> when capacity allows;
            otherwise it enters the expert queue for specialists who purchase leads on LECIPM.
          </p>
          {prefill?.from === "analyze" ? (
            <p className="mt-2 text-xs text-[#9CA3AF]">
              Numbers from your analysis are pre-filled — adjust anything before you send.
            </p>
          ) : null}
          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
            {status === "ok" || status === "err" ? (
              <p className={status === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"}>{msg}</p>
            ) : null}
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">Name *</label>
              <input name="name" required className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">Email *</label>
              <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">Phone</label>
              <input name="phone" type="tel" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[#C9A646]/90">Purchase price (est.)</label>
                <input
                  name="purchasePrice"
                  type="number"
                  min={0}
                  value={purchasePriceInput}
                  onChange={(e) => setPurchasePriceInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#C9A646]/90">Down payment (est.)</label>
                <input name="downPayment" type="number" min={0} className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">City / region</label>
              <input
                name="purchaseRegion"
                placeholder="e.g. Montreal, Laval…"
                value={purchaseRegionInput}
                onChange={(e) => setPurchaseRegionInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">How soon do you want to buy?</label>
              <select
                name="buyTimeline"
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Select…
                </option>
                <option value="ASAP / under 30 days">ASAP / under 30 days</option>
                <option value="1–3 months">1–3 months</option>
                <option value="3–6 months">3–6 months</option>
                <option value="6+ months / exploring">6+ months / exploring</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">Timeline</label>
              <input name="timeline" placeholder="e.g. 30–60 days" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">Property type</label>
              <input name="propertyType" placeholder="House, condo…" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A646]/90">Notes</label>
              <AiWriterToolbar
                className="mt-1 mb-2"
                type="mortgage"
                value={notes}
                onChange={setNotes}
                showDescriptionGenerator={false}
              />
              <SpellCheckField
                multiline
                name="message"
                rows={3}
                value={notes}
                onChange={setNotes}
                wrapperClassName="mt-1"
                className="w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
                variant="gold"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl py-3 text-sm font-bold text-[#0B0B0B]"
              style={{ background: GOLD }}
            >
              {mortgageCtaLabel(abVariant)}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white">Our mortgage experts</h2>
          {!primary ? (
            <p className="mt-4 text-sm text-[#737373]">
              Experts will appear here once registered.{" "}
              <Link href="/auth/signup-expert" className="text-[#C9A646] hover:underline">
                Expert signup
              </Link>
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {experts.map((ex) => {
                const waExpert = getContactWhatsAppUrl(
                  `Hi ${ex.name.split(/\s+/)[0] || ""} — I'd like help with a mortgage via LECIPM.`
                );
                return (
                  <div
                    key={ex.id}
                    className="rounded-2xl border border-[#C9A646]/35 bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-6 shadow-xl"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-[#C9A646]/50 bg-black sm:mx-0">
                        {ex.photo ? (
                          <Image
                            src={ex.photo}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="112px"
                            unoptimized={ex.photo.startsWith("/uploads")}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-[#737373]">Photo</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <p className="text-xl font-bold text-white">{ex.name}</p>
                        {ex.badges && ex.badges.length > 0 ? (
                          <p className="mt-1 flex flex-wrap justify-center gap-1 sm:justify-start">
                            {ex.badges.map((b) => (
                              <span
                                key={b}
                                className="rounded-full border border-[#C9A646]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#C9A646]"
                              >
                                {b}
                              </span>
                            ))}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-[#9CA3AF]">
                          ★ {ex.rating?.toFixed(1) ?? "5.0"}
                          {ex.reviewCount != null ? ` · ${ex.reviewCount} reviews` : ""}
                          {ex.totalDeals != null ? ` · ${ex.totalDeals} deals` : ""}
                        </p>
                        <p className="text-sm font-medium text-[#C9A646]">{ex.title || "Mortgage expert"}</p>
                        {ex.company ? <p className="text-sm text-[#B3B3B3]">{ex.company}</p> : null}
                        {ex.bio ? <p className="mt-2 text-sm text-[#B3B3B3]">{ex.bio}</p> : null}
                        {ex.phone ? <p className="mt-2 text-sm text-white">{ex.phone}</p> : null}
                        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                          <a
                            href={
                              ex.phone?.trim()
                                ? `tel:${ex.phone.trim()}`
                                : getBrokerTelHref()
                            }
                            className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/5"
                          >
                            Call
                          </a>
                          <a
                            href={waExpert}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-[#C9A646]/50 px-4 py-2 text-xs font-semibold text-[#C9A646] hover:bg-[#C9A646]/10"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
