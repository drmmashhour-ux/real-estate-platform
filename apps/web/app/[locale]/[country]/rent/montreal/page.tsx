import type { Metadata } from "next";
import { CityIntentLanding } from "@/components/growth/CityIntentLanding";
import { buildCityIntentMetadata } from "@/lib/growth/city-intent-seo";

export const revalidate = 180;

export async function generateMetadata(): Promise<Metadata> {
  return buildCityIntentMetadata("rent", "montreal", { canonicalPath: "/rent/montreal" });
}

export default function RentMontrealSeoPage() {
  return <CityIntentLanding intent="rent" cityParam="montreal" pathVariant="root" />;
}
