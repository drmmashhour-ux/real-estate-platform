import { redirect } from "next/navigation";

/** Single canonical landing — public conversion page lives at `/get-leads`. */
export default function LocaleGetLeadsRedirectPage() {
  redirect("/get-leads");
}
