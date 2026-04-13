import { PageSpinner } from "@/components/ui/PageSpinner";

export default function DashboardSectionLoading() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <PageSpinner label="Loading your workspace…" />
    </div>
  );
}
