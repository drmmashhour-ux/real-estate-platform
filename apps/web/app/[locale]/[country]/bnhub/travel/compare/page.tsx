import { TravelCompareClient } from "./travel-compare-client";

export const metadata = {
  title: "Travel & vacation AI | BNHUB",
  description:
    "AI assistant for comparing flights and all-inclusive packages using your own quotes, plus optional partner links and BNHUB stays.",
};

export default function TravelComparePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <TravelCompareClient />
    </main>
  );
}
