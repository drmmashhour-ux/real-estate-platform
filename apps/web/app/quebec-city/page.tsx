import { BnhubDominationCityPage, dominationCityMetadata } from "@/components/marketing/BnhubDominationCityPage";

export const metadata = dominationCityMetadata("quebec-city");

export const dynamic = "force-dynamic";

export default function QuebecCityBnhubPage() {
  return <BnhubDominationCityPage cityKey="quebec-city" />;
}
