import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { setUserRole } from "@/actions/admin";

export default async function AdminUsersPage() {
  const t = await getTranslations("Admin");

  const users = await prisma.syriaAppUser.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("tileUsers")}</h2>
        <p className="text-sm text-stone-600">{t("usersIntro")}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">{t("tableEmail")}</th>
              <th className="px-4 py-3">{t("tableName")}</th>
              <th className="px-4 py-3">{t("tableRole")}</th>
              <th className="px-4 py-3">{t("tableUpdate")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-stone-100 align-middle">
                <td className="px-4 py-3 text-xs font-medium text-stone-900">{u.email}</td>
                <td className="px-4 py-3 text-xs text-stone-600">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs">{u.role}</td>
                <td className="px-4 py-3">
                  <form action={setUserRole} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
                    >
                      <option value="USER">USER</option>
                      <option value="HOST">HOST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-stone-900 px-2 py-1 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      {t("save")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
