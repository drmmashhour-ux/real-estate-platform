import { redirect } from "next/navigation";

/** Canonical marketing URL; primary registration flow is `/auth/signup`. */
export default function RegisterAliasPage() {
  redirect("/auth/signup");
}
