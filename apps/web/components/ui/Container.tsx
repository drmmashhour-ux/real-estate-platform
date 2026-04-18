import type { HTMLAttributes, ReactNode } from "react";

/**
 * Max-width column with responsive horizontal padding (marketing / landing).
 */
export function Container({
  children,
  className = "",
  narrow = false,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Smaller max width for text-heavy sections */
  narrow?: boolean;
}) {
  return (
    <div
      className={[
        "mx-auto w-full px-4 sm:px-6",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
