import type { ReactNode } from "react";

export function OnboardingStepCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
