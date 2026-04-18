import { redirect } from "next/navigation";

/** Canonical marketing pricing lives under locale + country — default to Canada EN. */
export default function PricingRedirectPage() {
  redirect("/en/ca/pricing");
}
