"use client";

import Image from "next/image";
import { useState } from "react";
import { getBrokerPhoneDisplay, getBrokerTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";

const OACIQ_URL = "https://www.oaciq.com";

const INTRO = `Prefer expert support?

Work directly with a licensed broker to sell faster, negotiate better, and maximize your property value with clear guidance at every step.`;

const BULLETS = [
  "Market analysis",
  "Professional listing strategy",
  "Negotiation support",
  "Full transaction guidance",
  "Legal and compliance awareness",
] as const;

const WA_MESSAGE = `Hello, I would like a FREE consultation with your licensed broker (${PLATFORM_CARREFOUR_NAME}).`;

export type TrustedBrokerCardProps = {
  name?: string;
  title?: string;
  licenseNumber?: string;
  image: string;
  email: string;
  consultationHref?: string;
};

export default function TrustedBrokerCard({
  name = "Mohamed Al Mashhour",
  title = "Residential Real Estate Broker",
  licenseNumber = "J1321",
  image,
  email,
  consultationHref = "#sell-consultation",
}: TrustedBrokerCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const brokerDisplay = getBrokerPhoneDisplay();
  const telHref = getBrokerTelHref();
  const waHref = getContactWhatsAppUrl(WA_MESSAGE);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#C9A646]/35 bg-[#121212] shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition duration-300 hover:border-[#C9A646]/55 hover:shadow-[0_24px_70px_rgba(201, 166, 70,0.08)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(201, 166, 70,0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(201, 166, 70,0.12), transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative grid gap-8 p-6 md:grid-cols-2 md:gap-10 md:p-10">
        <div>
          <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-xl border-2 border-[#C9A646]/50 bg-[#0B0B0B] shadow-inner md:mx-0">
            {!imgFailed ? (
              <Image
                src={image}
                alt={`${name}, ${title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={() => setImgFailed(true)}
                priority={false}
              />
            ) : (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#1a1a1a] to-[#0B0B0B] p-8 text-center">
                <span className="font-serif text-5xl font-semibold text-[#C9A646]/90" aria-hidden>
                  MAM
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#B3B3B3]">Broker photo</span>
                <span className="text-[11px] text-[#737373]">Add image at /public/images/broker.jpg</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <header className="space-y-2 border-b border-white/10 pb-5">
            <span className="inline-flex w-fit rounded-full bg-[#C9A646] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0B0B0B]">
              Verified Broker
            </span>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">{name}</h2>
            <p className="text-base font-semibold text-[#C9A646]">{title}</p>
            <p className="text-sm text-[#B3B3B3]">
              License <span className="font-mono font-semibold text-white">{licenseNumber}</span>
            </p>
            <p className="text-sm leading-snug text-[#E5E5E5]">Licensed Residential Real Estate Broker (OACIQ)</p>
          </header>

          <div className="rounded-xl border border-[#C9A646]/25 bg-[#0B0B0B]/80 px-4 py-3">
            <p className="text-xs leading-relaxed text-[#B3B3B3]">
              Member / compliant with Québec real estate brokerage standards (OACIQ).
            </p>
            <a
              href={OACIQ_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-xs font-semibold text-[#C9A646] underline-offset-2 hover:text-[#E8C547] hover:underline"
            >
              Learn about OACIQ →
            </a>
          </div>

          <div className="whitespace-pre-line text-sm leading-relaxed text-[#B3B3B3]">{INTRO}</div>

          <ul className="space-y-2 text-sm text-[#E5E5E5]">
            {BULLETS.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-[#C9A646]" aria-hidden>
                  ✦
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border-2 border-[#C9A646]/40 bg-gradient-to-br from-[#1a1508]/80 to-[#0B0B0B] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">FREE for you</p>
            <ul className="mt-4 space-y-2 text-sm text-white">
              <li>
                <span className="font-bold text-[#C9A646]">FREE</span> consultation
              </li>
              <li>
                <span className="font-bold text-[#C9A646]">FREE</span> property evaluation
              </li>
              <li>
                <span className="font-bold text-[#C9A646]">No</span> obligation
              </li>
            </ul>
          </div>

          <p className="text-xs text-[#B3B3B3]/90">
            <a href={`mailto:${email}`} className="font-medium text-[#C9A646] hover:underline">
              {email}
            </a>
          </p>

          <div className="flex flex-col gap-3 pt-1">
            <a
              href={consultationHref}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#C9A646] px-6 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#C9A227] hover:shadow-[0_12px_32px_rgba(201, 166, 70,0.25)]"
            >
              Get my FREE consultation
            </a>
            <a
              href={telHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#C9A646] px-6 py-3 text-sm font-semibold text-[#C9A646] transition hover:-translate-y-0.5 hover:bg-[#C9A646]/10"
            >
              Call now →
              <span className="font-semibold text-white">{brokerDisplay}</span>
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-110"
            >
              WhatsApp →
              <span className="font-semibold">{brokerDisplay}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
