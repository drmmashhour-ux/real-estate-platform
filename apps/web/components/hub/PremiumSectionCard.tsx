import type { HubTheme } from "@/lib/hub/themes";

type PremiumSectionCardProps = {
  title: string;
  children: React.ReactNode;
  theme?: HubTheme;
  accent?: string;
  className?: string;
};

export function PremiumSectionCard({
  title,
  children,
  theme,
  accent,
  className = "",
}: PremiumSectionCardProps) {
  const color = accent ?? theme?.accent;
  return (
    <section
      className={`rounded-xl border p-6 shadow-lg shadow-black/15 transition-all duration-300 ease-out motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-xl sm:p-8 ${className}`}
      style={{
        backgroundColor: theme?.cardBg ?? "rgba(255,255,255,0.04)",
        borderColor: color ? `${color}40` : "rgba(255,255,255,0.08)",
      }}
    >
      <h2 className="text-lg font-semibold sm:text-xl" style={{ color: color ?? theme?.text ?? "#fff" }}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
