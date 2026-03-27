import type { DailyDealFeed } from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";
import { DailyDealCard } from "@/src/modules/daily-deal-feed/ui/DailyDealCard";
import { FeedBucketHeader } from "@/src/modules/daily-deal-feed/ui/FeedBucketHeader";

export function DailyDealSection({ section }: { section: DailyDealFeed["sections"][number] }) {
  return (
    <section className="mt-6">
      <FeedBucketHeader title={section.label} subtitle={`${section.items.length} listings`} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {section.items.map((item) => (
          <DailyDealCard key={item.listingId} item={item} />
        ))}
      </div>
    </section>
  );
}
