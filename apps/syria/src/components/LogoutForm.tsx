"use client";

import { logout } from "@/actions/auth";
import { useTranslations } from "next-intl";

export function LogoutForm() {
  const t = useTranslations("Common");

  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
      >
        {t("signOut")}
      </button>
    </form>
  );
}
