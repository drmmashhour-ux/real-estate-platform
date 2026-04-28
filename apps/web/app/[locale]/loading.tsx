import { PageSpinner } from "@/components/ui/PageSpinner";

/** Locale segment navigation — premium shell. */
export default function LocaleLoading() {
  return (
    <div className="min-h-screen bg-premium-bg">
      <PageSpinner label="Loading…" className="min-h-[45vh]" />
    </div>
  );
}
