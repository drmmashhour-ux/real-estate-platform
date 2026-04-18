import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

/** Revalidate app paths with the active locale prefix (e.g. /ar/buy). */
export async function revalidateSyriaPaths(...paths: string[]) {
  const locale = await getLocale();
  for (const path of paths) {
    if (path === "/" || path === "") {
      revalidatePath(`/${locale}`);
      continue;
    }
    const clean = path.startsWith("/") ? path.slice(1) : path;
    revalidatePath(`/${locale}/${clean}`);
  }
}
