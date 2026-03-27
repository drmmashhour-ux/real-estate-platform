import { BnhubDominationCityPage, dominationCityMetadata } from "@/components/marketing/BnhubDominationCityPage";

export const metadata = dominationCityMetadata("vancouver");

export const dynamic = "force-dynamic";

export default function VancouverBnhubPage() {
  return <BnhubDominationCityPage cityKey="vancouver" />;
}
