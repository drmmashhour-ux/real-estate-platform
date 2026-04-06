import { TravelCompareClient } from "./travel-compare-client";

export const metadata = {
  title: "Travel & vacation AI | BNHub",
  description:
    "AI assistant for comparing flights and all-inclusive packages using your own quotes, plus optional partner links and BNHub stays.",
};

export default function TravelComparePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <TravelCompareClient />
    </main>
  );
}
