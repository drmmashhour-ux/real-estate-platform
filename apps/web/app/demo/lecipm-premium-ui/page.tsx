"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { Divider } from "@/components/ui/Divider";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { ComplianceScoreCard } from "@/components/ui/ComplianceScoreCard";
import { RiskPanel } from "@/components/ui/RiskPanel";
import { NoticePanel } from "@/components/ui/NoticePanel";
import { LecipmPremiumTopNav } from "@/components/ui/LecipmPremiumTopNav";
import { LECIPM_PREMIUM } from "@/lib/theme/lecipm-premium-tokens";

/**
 * LECIPM Premium — live component gallery (dev / design QA).
 * Theme: Tailwind @theme in `app/globals.css` + `design-system/lecipm-premium.css` + `lib/theme/lecipm-premium-tokens.ts`
 */
export default function LecipmPremiumUiDemoPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lp-surface min-h-dvh">
      <LecipmPremiumTopNav
        links={[
          { href: "#typography", label: "Type" },
          { href: "#actions", label: "Actions" },
          { href: "#forms", label: "Forms" },
          { href: "#compliance", label: "Compliance" },
        ]}
        rightSlot={
          <Button variant="lpPrimary" size="lg" className="w-full min-h-12 sm:w-auto">
            Get started
          </Button>
        }
      />

      <main>
        <Section
          tone="premium"
          enter
          eyebrow="Design system"
          title="LECIPM Premium"
          subtitle="Calm, minimal surfaces on true black, with a single gold accent. Built for focus — not noise."
        >
          <p className="lp-body text-sm sm:text-base">
            Tokens: background <code className="text-ds-gold">{LECIPM_PREMIUM.background}</code>, gold{" "}
            <code className="text-ds-gold">{LECIPM_PREMIUM.gold}</code>, surface <code className="text-ds-gold">{LECIPM_PREMIUM.surface}</code>, border{" "}
            <code className="text-ds-gold">{LECIPM_PREMIUM.border}</code>.
          </p>
        </Section>

        <div id="typography" className="lp-section-bleed max-w-5xl space-y-6 pb-10">
          <h2 className="lp-h2">Large, bold headings</h2>
          <p className="lp-body max-w-2xl">
            Body copy stays open and legible. Sections breathe — spacing scales up on larger screens, not tighter grids of clutter.
          </p>
          <Divider label="Component samples" />
        </div>

        <Section id="actions" className="py-6 md:py-10" containerClassName="max-w-5xl" title="Actions" tone="premium" subtitle="Primary gold, secondary outline. Large tap targets on mobile.">
          <div className="grid gap-4 sm:flex sm:flex-wrap">
            <Button variant="lpPrimary" size="lg" className="min-h-12 w-full min-w-0 sm:w-auto sm:px-8">
              Primary
            </Button>
            <Button variant="outlineGold" size="lg" className="min-h-12 w-full min-w-0 sm:w-auto sm:px-8">
              Secondary
            </Button>
            <Button variant="ghost" size="lg" className="min-h-12 w-full min-w-0 sm:w-auto">
              Ghost
            </Button>
          </div>
        </Section>

        <div id="forms" className="lp-section-bleed max-w-3xl space-y-8 pb-16">
          <h2 className="lp-h2">Forms</h2>
          <Card variant="lecipm" className="lp-step">
            <CardHeader>
              <CardTitle className="text-ds-text">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField label="Full name" hint="As it appears on your ID" tone="lecipm">
                <Input name="name" autoComplete="name" size="lg" mode="lecipm" placeholder="Alexandre Tremblay" />
              </FormField>
              <FormField label="Email" hint="We never sell your address" tone="lecipm">
                <Input name="email" type="email" size="lg" mode="lecipm" placeholder="you@example.com" />
              </FormField>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Button type="button" variant="lpPrimary" className="w-full min-h-12 sm:w-auto sm:px-10">
                  Send
                </Button>
                <Button type="button" variant="outlineGold" onClick={() => setOpen(true)} className="w-full min-h-12 sm:w-auto sm:px-8">
                  Open modal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div id="compliance" className="lp-section-bleed max-w-6xl space-y-10 pb-24">
          <h2 className="lp-h2">Compliance, risks, notices</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ComplianceScoreCard
              band="good"
              score={86}
              caption="File is consistent with the latest broker checklist. Still verify dates with your compliance lead."
            />
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="complianceGood">Good</Badge>
                <Badge variant="complianceWarning">Warning</Badge>
                <Badge variant="complianceCritical">Critical</Badge>
              </div>
              <NoticePanel
                title="Upcoming attestation"
                tone="info"
                footnote="This is an internal reminder, not legal advice."
              >
                The annual attestation window opens in 14 days. Complete it before listings sync to the premium tier.
              </NoticePanel>
            </div>
          </div>
          <RiskPanel
            title="Risks to clear"
            subtitle="Color coding: red = critical, yellow = review soon, green = in good shape or quick win, gold = context."
            items={[
              {
                id: "1",
                level: "critical",
                title: "Missing E&O renewal",
                description: "Update policy dates before accepting new offers.",
              },
              {
                id: "2",
                level: "warning",
                title: "ID verification on file is older than 2 years",
                description: "Schedule a short re-check for this agent.",
              },
              {
                id: "3",
                level: "ok",
                title: "Two-factor for admins",
                description: "Optional quick win — reduces account takeover risk.",
              },
            ]}
          />
        </div>
      </main>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Simple modal"
        footer={
          <Button type="button" variant="lpPrimary" onClick={() => setOpen(false)} className="min-h-11 px-6">
            Close
          </Button>
        }
      >
        <p>Soft shadow, gold-friendly focus, and full-width on small screens — interactions stay smooth and legible.</p>
      </Modal>
    </div>
  );
}
