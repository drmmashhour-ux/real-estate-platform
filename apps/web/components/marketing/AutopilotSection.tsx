import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

const CARDS = [
  { title: "Pricing autopilot", body: "Suggestions from internal demand and peer context — approval-first." },
  { title: "Listing optimization", body: "Quality, media, and trust prompts that respect platform rules." },
  { title: "Revenue insights", body: "Dashboards for net economics — modeled where assumptions apply." },
  { title: "Fraud detection", body: "Risk signals for safer transactions — human review on edge cases." },
  { title: "Reputation system", body: "Trust-building tools for hosts and guests over time." },
] as const;

export function AutopilotSection() {
  return (
    <section className="border-b border-white/5 bg-landing-black py-14 sm:py-20">
      <Container>
        <h2 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">
          Intelligence & safety layers
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-landing-text/75">
          Capabilities vary by plan and verification — nothing here runs irreversible financial actions without your review
          where required.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <Card key={c.title} hoverable className="border-white/10 bg-landing-dark/60">
              <h3 className="font-semibold text-premium-gold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-landing-text/85">{c.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
