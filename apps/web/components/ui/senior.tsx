"use client";

import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { SeniorPrimaryButton } from "@/components/ui/Button";

/** Larger type, calmer chrome for Senior Living Hub (Part 15). */
export function SeniorCard(props: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card variant="residence" className={props.className ?? ""}>
      <h3 className="text-[22px] font-semibold leading-snug text-[#0B0B0B]">{props.title}</h3>
      <div className="mt-4 text-[18px] leading-relaxed text-[#5C5C57]">{props.children}</div>
      {props.footer ?
        <div className="mt-6">{props.footer}</div>
      : null}
    </Card>
  );
}

export function SeniorStepCard(props: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--ds-radius-xl)] border border-[#D9D9D2] bg-white p-6 shadow-[var(--ds-shadow-card)]">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/15 text-lg font-bold text-[#B8921E]">
        {props.step}
      </span>
      <h3 className="mt-4 text-xl font-semibold text-[#0B0B0B]">{props.title}</h3>
      <div className="mt-3 text-[18px] leading-relaxed text-[#5C5C57]">{props.children}</div>
    </div>
  );
}

export function SeniorResultCard(props: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--ds-radius-xl)] border border-[#D9D9D2] bg-[#FAFAF7] p-6 shadow-sm transition hover:shadow-[var(--ds-shadow-card-hover)]">
      <h4 className="text-lg font-semibold text-[#0B0B0B]">{props.title}</h4>
      {props.subtitle ?
        <p className="mt-2 text-[16px] text-[#5C5C57]">{props.subtitle}</p>
      : null}
      {props.action ?
        <div className="mt-5">{props.action}</div>
      : null}
    </div>
  );
}

export function BestMatchBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--ds-radius-lg)] border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 text-[18px] font-medium text-[#0B0B0B] shadow-sm ring-1 ring-[#D4AF37]/20">
      {children}
    </div>
  );
}

export { SeniorPrimaryButton };
