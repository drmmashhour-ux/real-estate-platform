"use client";

type PremiumCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  accent?: string;
  dark?: boolean;
};

const defaultCardStyle = {
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.05)",
  transition: "all 0.2s ease",
};

export function PremiumCard({
  children,
  className = "",
  style = {},
  accent = "#C9A96E",
  dark = true,
}: PremiumCardProps) {
  return (
    <div
      className={`${className} hover:scale-[1.01]`}
      style={{
        ...defaultCardStyle,
        backgroundColor: dark ? "rgba(15,15,15,0.7)" : "rgba(255,255,255,0.96)",
        border: `1px solid ${accent}20`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
