import { BnhubDominationCityPage, dominationCityMetadata } from "@/components/marketing/BnhubDominationCityPage";

export const metadata = dominationCityMetadata("montreal");

export const dynamic = "force-dynamic";

export default function MontrealBnhubPage() {
  return <BnhubDominationCityPage cityKey="montreal" />;
}
