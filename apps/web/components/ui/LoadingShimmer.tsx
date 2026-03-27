/** Skeleton block for loading states — use `dark` on #0B0B0B / slate UIs. */
export function LoadingShimmer({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const shell =
    variant === "dark"
      ? "animate-pulse rounded-xl bg-gradient-to-r from-slate-800 via-slate-700/90 to-slate-800 bg-[length:200%_100%]"
      : "animate-pulse rounded-xl bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 bg-[length:200%_100%]";
  return <div className={`${shell} ${className}`.trim()} aria-hidden />;
}
