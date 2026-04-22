"use client";

import Link from "next/link";

export type SeniorBestMatchCardProps = {
  headline: string;
  bullets: string[];
  residenceName: string;
  residenceCity: string;
  province: string;
  detailHref: string;
  visitHref: string;
  badgeLabel?: string;
  ctaLabel?: string;
};

/**
 * Plain-language hero card — no numeric scores exposed to families.
 */
export function SeniorBestMatchCard(props: SeniorBestMatchCardProps) {
  const badge = props.badgeLabel ?? "Best match";
  const cta = props.ctaLabel ?? "Request a visit";
  return (
    <section className="rounded-2xl border-2 border-amber-600 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-6 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border-2 border-amber-700 bg-amber-100 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-amber-950">
          {badge}
        </span>
      </div>
      <h2 className="mt-4 text-2xl font-bold leading-tight text-neutral-900">{props.headline}</h2>
      <p className="mt-2 text-lg font-semibold text-neutral-800">
        {props.residenceName}
        <span className="block text-base font-medium text-neutral-600">
          {props.residenceCity}, {props.province}
        </span>
      </p>
      <ul className="mt-4 space-y-2 text-lg text-neutral-900">
        {props.bullets.slice(0, 4).map((b) => (
          <li key={b} className="flex gap-2">
            <span className="font-bold text-teal-800" aria-hidden>
              •
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Link
        href={props.visitHref}
        className="sl-btn-primary mt-8 inline-flex min-h-[56px] w-full items-center justify-center text-center text-xl font-bold no-underline sm:w-auto sm:min-w-[280px]"
      >
        {cta}
      </Link>
      <Link
        href={props.detailHref}
        className="mt-4 block text-center text-lg font-bold text-teal-800 underline decoration-2 underline-offset-4 sm:text-left"
      >
        See details
      </Link>
    </section>
  );
}
