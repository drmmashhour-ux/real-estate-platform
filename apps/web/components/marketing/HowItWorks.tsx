import { Container } from "@/components/ui/Container";

const STEPS = [
  { title: "List property", body: "Publish FSBO or BNHub stays with verification where required." },
  { title: "AI analyzes", body: "Internal signals surface pricing and performance context — not external appraisals." },
  { title: "Optimize pricing", body: "Recommendations stay in your control until you approve changes." },
  { title: "Earn more", body: "Track net income with transparent fees and optional growth tools." },
] as const;

export function HowItWorks() {
  return (
    <section className="border-b border-white/5 bg-landing-dark py-14 sm:py-20">
      <Container>
        <h2 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">
          How it works
        </h2>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-white/10 bg-landing-black/50 p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-premium-gold/15 text-sm font-bold text-premium-gold">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-landing-text/80">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
