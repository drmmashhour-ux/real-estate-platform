import { cn } from "@/lib/utils";

const blocks = [
  {
    title: "Verified listings",
    text: "Listings can be checked for quality, trust, and required documentation before publication.",
  },
  {
    title: "Smarter pricing",
    text: "AI-assisted pricing helps sellers and hosts stay competitive.",
  },
  {
    title: "Built for Québec compliance",
    text: "Designed around real estate disclosure and audit-readiness workflows.",
  },
] as const;

type Props = {
  /** `inverted` matches dark LECIPM marketing pages (e.g. luxury home). */
  variant?: "default" | "inverted";
};

export function TrustConversionBlocks({ variant = "default" }: Props) {
  const inverted = variant === "inverted";

  const section = (
    <section
      className={cn("mx-auto max-w-6xl px-6 py-16", inverted && "text-white")}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {blocks.map((block) => (
          <div
            key={block.title}
            className={cn(
              "rounded-2xl p-6",
              inverted
                ? "border border-white/10 bg-white/[0.04]"
                : "border"
            )}
          >
            <h3 className={cn("text-lg font-semibold", inverted && "text-white")}>
              {block.title}
            </h3>
            <p
              className={cn(
                "mt-2 text-sm",
                inverted ? "text-zinc-400" : "text-muted-foreground"
              )}
            >
              {block.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );

  if (inverted) {
    return (
      <div className="w-full border-b border-t border-white/5 bg-zinc-950/50">
        {section}
      </div>
    );
  }

  return section;
}
