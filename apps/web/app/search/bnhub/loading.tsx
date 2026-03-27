import { PageSpinner } from "@/components/ui/PageSpinner";

export default function BnhubSearchLoading() {
  return (
    <div className="min-h-[60vh] bg-[#0B0B0B]">
      <PageSpinner label="Loading search…" />
    </div>
  );
}
