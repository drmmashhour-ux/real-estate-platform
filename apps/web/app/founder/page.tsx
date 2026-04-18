import { redirect } from "next/navigation";

/** Backward-compatible entry: founder workspace lives under `/{locale}/{country}/founder`. */
export default function FounderRootRedirectPage() {
  redirect("/fr/ca/founder");
}
