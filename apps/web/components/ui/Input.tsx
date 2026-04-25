import type { InputHTMLAttributes } from "react";

type InputMode = "light" | "dark" | "lecipm";
type InputSize = "md" | "lg";

const modes: Record<InputMode, string> = {
  light:
    "border-[var(--color-border)] bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]",
  dark: "border-white/15 bg-[#111111] text-white placeholder:text-[var(--color-text-muted)]",
  lecipm: "border-ds-border bg-ds-card text-ds-text placeholder:text-ds-text-secondary/60",
};

const sizes: Record<InputSize, string> = {
  md: "rounded-xl px-4 py-2.5 text-sm",
  /** Large tap targets (mobile-first forms) */
  lg: "rounded-2xl px-4 py-3.5 min-h-[52px] text-base",
};

export function Input({
  className = "",
  mode = "dark",
  size = "md",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { mode?: InputMode; size?: InputSize }) {
  const ringOffset =
    mode === "light"
      ? "focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      : "focus-visible:ring-offset-ds-bg";
  return (
    <input
      className={[
        "w-full border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]",
        ringOffset,
        "disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition",
        sizes[size],
        modes[mode],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
