import { PageSpinner } from "@/components/ui/PageSpinner";

/** Root route segment — matches black + gold marketing shell. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-premium-bg">
      <PageSpinner label="Loading…" className="min-h-[50vh]" />
    </div>
  );
}
