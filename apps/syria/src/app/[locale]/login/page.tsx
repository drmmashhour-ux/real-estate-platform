import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { loginWithEmail } from "@/actions/auth";

export default async function LoginPage() {
  const t = await getTranslations("Login");

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {t("subtitle")}
        </p>
      </div>
      <form action={loginWithEmail} className="space-y-4">
        <label className="block text-sm font-medium text-stone-700">
          {t("email")}
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          {t("name")}
          <input
            name="name"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-stone-400"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" name="as_admin" className="mt-1 size-4 rounded border-stone-300" />
          <span>
            {t("staffAdmin")}{" "}
            <span className="block text-xs text-stone-500">{t("staffAdminHint")}</span>
          </span>
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-[color:var(--color-syria-olive)] py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          {t("submit")}
        </button>
      </form>
      <p className="text-center text-sm text-stone-600">
        <Link href="/" className="font-medium text-[color:var(--color-syria-olive)] hover:underline">
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}
