import type { BrokerIntelligenceInsight } from "@/lib/broker/intelligence";

type Props = { insights: BrokerIntelligenceInsight[] };

export function BrokerIntelligencePanel({ insights }: Props) {
  return (
    <section className="rounded-2xl border p-6">
      <h2 className="text-2xl font-semibold">Broker Intelligence</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Performance signals and recommended actions for your listings.
      </p>
      <div className="mt-6 space-y-4">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listing signals yet for this range.</p>
        ) : (
          insights.map((item) => (
            <div key={item.listingId} className="rounded-xl border p-4">
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1 text-sm">
                Conversion rate: {(item.conversionRate * 100).toFixed(2)}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Status: {item.status} · {item.bookings} bookings / {item.views} views
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.recommendation}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
