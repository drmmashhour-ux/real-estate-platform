"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicMortgageExpertCard } from "@/modules/mortgage/services/public-experts";
import { getBrokerTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";

const GOLD = "var(--color-premium-gold)";

export function ExpertsDirectoryClient({ experts }: { experts: PublicMortgageExpertCard[] }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Verified mortgage experts</h2>
          <p className="mt-1 text-sm text-[#B3B3B3]">
            Ranked by performance, client feedback, and platform tier. Request a match from the{" "}
            <Link href="/mortgage" className="font-semibold text-premium-gold hover:underline">
              mortgage page
            </Link>
            .
          </p>
        </div>
      </div>
      {experts.length === 0 ? (
        <p className="text-sm text-[#737373]">Experts will appear here once onboarded and verified.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {experts.map((ex) => {
            const wa = getContactWhatsAppUrl(
              `Hi ${ex.name.split(/\s+/)[0] || ""} — I'd like help with a mortgage via LECIPM.`
            );
            return (
              <li
                key={ex.id}
                className="rounded-2xl border border-premium-gold/30 bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-6"
              >
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-premium-gold/40 bg-black">
                    {ex.photo ? (
                      <Image
                        src={ex.photo}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized={ex.photo.startsWith("/uploads")}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[#737373]">Photo</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white">{ex.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ex.badges.map((b) => (
                        <span
                          key={b}
                          className="rounded-full border border-premium-gold/35 px-2 py-0.5 text-[9px] font-bold uppercase text-premium-gold"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[#9CA3AF]">
                      ★ {ex.rating.toFixed(1)} · {ex.reviewCount} reviews · {ex.totalDeals} deals · {ex.plan} plan
                    </p>
                    {ex.company ? <p className="mt-1 text-sm text-[#B3B3B3]">{ex.company}</p> : null}
                  </div>
                </div>
                {ex.bio ? <p className="mt-3 text-sm text-[#B3B3B3] line-clamp-3">{ex.bio}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={ex.phone?.trim() ? `tel:${ex.phone.trim()}` : getBrokerTelHref()}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-[#0B0B0B]"
                    style={{ background: GOLD }}
                  >
                    Call
                  </a>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/5"
                  >
                    WhatsApp
                  </a>
                  <Link
                    href="/mortgage"
                    className="rounded-xl border border-premium-gold/50 px-4 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10"
                  >
                    Request contact
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
