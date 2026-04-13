import type { Metadata } from "next";
import { CityIntentLanding } from "@/components/growth/CityIntentLanding";
import { buildCityIntentMetadata } from "@/lib/growth/city-intent-seo";

export const revalidate = 180;

export async function generateMetadata(): Promise<Metadata> {
  return buildCityIntentMetadata("investment", "montreal", { canonicalPath: "/invest/montreal" });
}

export default function InvestMontrealSeoPage() {
  return <CityIntentLanding intent="investment" cityParam="montreal" pathVariant="root" />;
}
