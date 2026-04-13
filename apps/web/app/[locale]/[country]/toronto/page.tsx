import { BnhubDominationCityPage, dominationCityMetadata } from "@/components/marketing/BnhubDominationCityPage";

export const metadata = dominationCityMetadata("toronto");

export const dynamic = "force-dynamic";

export default function TorontoBnhubPage() {
  return <BnhubDominationCityPage cityKey="toronto" />;
}
