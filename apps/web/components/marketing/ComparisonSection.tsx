import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

const LEFT = ["Higher total cost of sale on many channels", "Limited pricing context", "Manual guesswork on nightly rates"];
const RIGHT = ["Configurable host economics & transparent fees", "Internal pricing signals where data exists", "Recommendations you approve — never auto-applied blindly"];

export function ComparisonSection() {
  return (
    <section className="border-b border-white/5 bg-landing-dark py-14 sm:py-20">
      <Container>
        <h2 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">
          Built for net income clarity
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-landing-text/75 sm:text-base">
          Honest positioning — we don’t claim universal superiority; we focus on tools and transparency you can verify.
        </p>

        <div className="relative mt-12 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-4">
          <Card glow={false} className="border-white/10 bg-landing-black/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Typical OTAs / siloed tools</p>
            <ul className="mt-4 space-y-3 text-sm text-landing-text/85">
              {LEFT.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-rose-400/90" aria-hidden>
                    ·
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex items-center justify-center md:px-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-premium-gold/40 bg-premium-gold/10 font-[family-name:var(--font-serif)] text-xl font-semibold text-premium-gold shadow-landing-glow">
              VS
            </div>
          </div>

          <Card glow className="border-premium-gold/25 bg-landing-black/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">LECIPM</p>
            <ul className="mt-4 space-y-3 text-sm text-landing-text/90">
              {RIGHT.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-premium-gold" aria-hidden>
                    ✓
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Container>
    </section>
  );
}
