import { ExpertMarketplaceClient } from "./marketplace-client";

export const dynamic = "force-dynamic";

export default function ExpertMarketplacePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#C9A646]">Lead marketplace</h1>
      <p className="mt-2 text-sm text-[#B3B3B3]">
        When auto-routing is at capacity, new inquiries land here first. Claiming uses your daily cap and pay-per-lead
        credits (same rules as assigned leads).
      </p>
      <ExpertMarketplaceClient />
    </div>
  );
}
