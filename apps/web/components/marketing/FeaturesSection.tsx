import type { ReactNode } from "react";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";
import { PLATFORM_FEATURES } from "@/lib/marketing/platform-features";

const Icon = ({ children }: { children: ReactNode }) => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    {children}
  </svg>
);

const FEATURE_ICONS: Record<string, ReactNode> = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="18" height="8" rx="1.5" />
    </Icon>
  ),
  "crm-clients": (
    <Icon>
      <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
    </Icon>
  ),
  "offers-contracts": (
    <Icon>
      <path d="M12 3v18M3 12h18" strokeLinecap="round" />
    </Icon>
  ),
  "document-deal-rooms": (
    <Icon>
      <path d="M4 4h10l4 4v12H4z" strokeLinejoin="round" />
    </Icon>
  ),
  messaging: (
    <Icon>
      <path d="M4 6h16v10H8l-4 4V6z" strokeLinejoin="round" />
    </Icon>
  ),
  scheduling: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4" strokeLinecap="round" />
    </Icon>
  ),
  "commissions-invoices": (
    <Icon>
      <path d="M4 20V10M10 20V4M16 20v-6M22 20V14" strokeLinecap="round" />
    </Icon>
  ),
  "notifications-tasks": (
    <Icon>
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </Icon>
  ),
  "lead-intake": (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </Icon>
  ),
};

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Platform pillars"
          title="Everything your brokerage runs on"
          subtitle="Purpose-built modules that share one data model — not another patchwork of tabs."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_FEATURES.map((f, i) => (
            <AnimatedReveal key={f.slug} delayMs={i * 45}>
              <FeatureCard
                href={`/features/${f.slug}`}
                icon={FEATURE_ICONS[f.slug] ?? <Icon><circle cx="12" cy="12" r="9" /></Icon>}
                title={f.title}
                description={f.description}
              />
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
