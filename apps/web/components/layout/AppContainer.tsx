import type { ReactNode } from "react";

type MaxWidth = "6xl" | "7xl" | "full";

const maxW: Record<MaxWidth, string> = {
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

/**
 * Centered horizontal layout — default padding matches `SPACING` rhythm (`md` = 16px horizontal).
 */
export function AppContainer({
  children,
  className = "",
  maxWidth = "6xl",
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: MaxWidth;
}) {
  return (
    <div className={["mx-auto w-full px-4 sm:px-6", maxW[maxWidth], className].join(" ")}>
      {children}
    </div>
  );
}
