import { SearchX } from "lucide-react";

/** Default icon for “no listings” / filter-empty browse states — pair with `EmptyState`. */
export function FiltersEmptyIcon({ className = "h-7 w-7" }: { className?: string }) {
  return <SearchX className={className} strokeWidth={1.5} aria-hidden />;
}
