import { cn } from "@/lib/utils";

type PremiumTrustProps = {
  className?: string;
};

/**
 * Premium perception near checkout — short trust line + hand-picked positioning.
 */
export function PremiumTrust({ className }: PremiumTrustProps) {
  return (
    <div className={cn("mt-4 text-sm text-zinc-600 dark:text-zinc-400", className)}>
      <p>
        ✔ Curated listings
        <br />
        ✔ Secure payment
        <br />✔ Best value selection
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Hand-picked for quality and value</p>
    </div>
  );
}
