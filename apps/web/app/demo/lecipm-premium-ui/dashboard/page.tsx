import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { LecipmPremiumTopNav } from "@/components/ui/LecipmPremiumTopNav";

/**
 * LECIPM Premium — example dashboard: stacked cards, no clutter, mobile-first.
 */
export default function LecipmPremiumDashboardExamplePage() {
  return (
    <div className="lp-surface min-h-dvh">
      <LecipmPremiumTopNav
        links={[
          { href: "/demo/lecipm-premium-ui", label: "System" },
          { href: "#overview", label: "Overview" },
        ]}
      />
      <main className="lp-section-bleed max-w-5xl space-y-8 pb-20 pt-4">
        <p className="text-sm text-ds-text-secondary">
          <Link href="/demo/lecipm-premium-ui" className="text-ds-gold hover:underline">
            ← Back to system gallery
          </Link>
        </p>
        <Section
          id="overview"
          tone="premium"
          title="Today"
          subtitle="A quiet dashboard: one focus per block, generous spacing, easy tap targets on small screens."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {["Inbox", "Pipeline", "Team", "Reports"].map((k) => (
              <Card key={k} variant="lecipm" className="lp-fade">
                <CardHeader>
                  <CardTitle className="text-ds-text">{k}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-ds-text">—</p>
                  <p className="mt-2 text-sm text-ds-text-secondary">Placeholder metric</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
