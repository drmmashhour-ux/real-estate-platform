import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/** API routes: no next-intl request — revalidate all locale home pages. */
export function revalidateAllLocaleHomePages(): void {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`);
  }
}
