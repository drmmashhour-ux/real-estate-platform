import { cn } from "@/lib/utils";

type HelpBannerProps = {
  className?: string;
  /** Use on dark UIs (BNHUB / buyer listing). */
  variant?: "light" | "dark";
};

export function HelpBanner({ className, variant = "light" }: HelpBannerProps) {
  return (
    <div
      className={cn(
        "mt-6 rounded-xl p-4 text-sm",
        variant === "dark"
          ? "border border-white/10 bg-white/5 text-white/90"
          : "bg-gray-100 text-zinc-800",
        className
      )}
    >
      <span aria-hidden>💬</span> Need help finding the right place?
      <br />
      We can help you personally — just message us.
    </div>
  );
}
