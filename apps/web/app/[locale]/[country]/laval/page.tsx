import { BnhubDominationCityPage, dominationCityMetadata } from "@/components/marketing/BnhubDominationCityPage";

export const metadata = dominationCityMetadata("laval");

export const dynamic = "force-dynamic";

export default function LavalBnhubPage() {
  return <BnhubDominationCityPage cityKey="laval" />;
}
