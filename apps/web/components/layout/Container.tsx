import type { HTMLAttributes, ReactNode } from "react";

const maxW: Record<"sm" | "md" | "lg" | "xl" | "full", string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  full: "max-w-full",
};

/**
 * Design-system width container — distinct from `components/ui/Container` (landing).
 */
export function Container({
  children,
  className = "",
  size = "xl",
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  size?: keyof typeof maxW;
}) {
  return (
    <div
      className={["mx-auto w-full px-4 sm:px-6", maxW[size], className].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
