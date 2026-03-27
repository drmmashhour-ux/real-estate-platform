import type { InputHTMLAttributes } from "react";

type InputMode = "light" | "dark";

const modes: Record<InputMode, string> = {
  light:
    "border-[var(--color-border)] bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]",
  dark: "border-white/15 bg-[#111111] text-white placeholder:text-[var(--color-text-muted)]",
};

export function Input({
  className = "",
  mode = "dark",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { mode?: InputMode }) {
  const ringOffset =
    mode === "dark"
      ? "focus-visible:ring-offset-[#0B0B0B]"
      : "focus-visible:ring-offset-2 focus-visible:ring-offset-white";
  return (
    <input
      className={[
        "w-full rounded-xl border px-4 py-2.5 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]",
        ringOffset,
        "disabled:cursor-not-allowed disabled:opacity-50",
        modes[mode],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
