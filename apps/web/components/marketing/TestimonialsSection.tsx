import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

const PLACEHOLDERS = [
  { quote: "Placeholder — host quote forthcoming.", attribution: "Host, Québec" },
  { quote: "Placeholder — buyer quote forthcoming.", attribution: "Buyer, Montréal" },
] as const;

export function TestimonialsSection() {
  return (
    <section className="border-b border-white/5 bg-landing-black py-14 sm:py-20">
      <Container>
        <h2 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">
          What people say
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-xs text-white/45">
          Testimonials will be replaced with verified reviews — not fabricated endorsements.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PLACEHOLDERS.map((t) => (
            <Card key={t.quote} className="border-white/10 bg-landing-dark/50">
              <p className="text-sm italic leading-relaxed text-landing-text/90">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-xs font-medium text-white/50">{t.attribution}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
