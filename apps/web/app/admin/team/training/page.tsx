import type { Metadata } from "next";
import Link from "next/link";
import { DEMO_TRAINING_STEPS } from "@/components/demo/demo-training-data";
import { FieldTeamRulesPanel } from "@/components/team/FieldTeamRulesPanel";
import { FIELD_TEAM_DAILY_TARGETS } from "@/components/team/team-constants";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { requireFieldTeamAdminPage } from "@/lib/admin/field-team-admin";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Field Team Training | LECIPM",
  description: "Four-day field specialist curriculum: product, script, roleplay, and first live demo.",
};

const DAYS = [
  {
    title: "DAY 1 — Product",
    items: ["Understand LECIPM (positioning, hubs, compliance story)", "Watch the full demo (recording or live with a coach)"],
  },
  {
    title: "DAY 2 — Script",
    items: ["Memorize the approved demo script", "Practice pacing, clicks, and transitions"],
  },
  {
    title: "DAY 3 — Roleplay",
    items: ["Run objection drills with a partner", "Use the roleplay simulator / training workspace"],
  },
  {
    title: "DAY 4 — Real Demo",
    items: ["Shadow an experienced field specialist", "Run your first supervised demo and log the outcome in `/field`"],
  },
];

export default async function FieldTeamTrainingPage() {
  const { user } = await getSession();
  requireFieldTeamAdminPage(user, "/admin/team/training");

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-16 pt-8 text-white">
      <div className="mx-auto max-w-4xl space-y-8 px-4">
        <header className="space-y-2">
          <Link href="/admin/team" className="text-xs text-premium-gold hover:underline">
            ← Field team admin
          </Link>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">Field specialist training</h1>
          <p className="text-sm text-white/65">
            Daily cadence: {FIELD_TEAM_DAILY_TARGETS.brokerContacts} broker contacts, {FIELD_TEAM_DAILY_TARGETS.demos}{" "}
            demos, {FIELD_TEAM_DAILY_TARGETS.followUps} follow-ups.
          </p>
        </header>

        <FieldTeamRulesPanel />

        <div className="grid gap-4">
          {DAYS.map((d) => (
            <Card key={d.title} variant="default" className="border-white/10 bg-[#121212]">
              <CardHeader>
                <CardTitle className="text-lg text-white">{d.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-white/80">
                  {d.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card variant="default" className="border-white/10 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Demo script (step-by-step)</CardTitle>
            <p className="text-sm text-white/55">Same structure as field agents use on `/field`.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal space-y-3 pl-5 text-sm text-white/85">
              {DEMO_TRAINING_STEPS.map((s) => (
                <li key={s.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  <div className="font-medium text-white">{s.stepNumber}. {s.title}</div>
                  <div className="mt-1 text-white/70">{s.script}</div>
                  {s.action ? <div className="mt-1 text-xs text-premium-gold/90">Click: {s.action}</div> : null}
                </li>
              ))}
            </ol>
            <Link href="/marketing/demo-training">
              <Button variant="outline" size="sm">
                Open demo training page
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card variant="default" className="border-white/10 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Objection handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/80">
            <p>Study the objection library and practice short reframes. Always defer legal questions to the broker&apos;s counsel.</p>
            <Link href="/marketing/objections">
              <Button variant="outline" size="sm">
                Objection playbook
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card variant="default" className="border-white/10 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-lg text-white">LECI usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/80">
            <p>
              Field agents use LECI for phrasing and live objections (`userRole: field_agent`). From the browser, open the global LECI surface
              or the{" "}
              <Link href="/field" className="text-premium-gold underline-offset-2 hover:underline">
                field dashboard
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card variant="default" className="border-white/10 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Roleplay simulator</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/80">
            <p className="mb-3">Use the broker workspace training module for structured roleplay (when logged in as a training account).</p>
            <Link href="/en/ca/dashboard/training">
              <Button variant="goldPrimary" size="sm">
                Open training workspace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
