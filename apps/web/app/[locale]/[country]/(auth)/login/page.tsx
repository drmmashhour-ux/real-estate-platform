import { redirect } from "next/navigation";

/** Canonical marketing URL; implementation lives under `/auth/login`. */
export default function LoginAliasPage() {
  redirect("/auth/login");
}
