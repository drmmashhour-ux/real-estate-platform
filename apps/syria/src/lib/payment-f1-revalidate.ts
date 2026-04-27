import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/** After F1 confirm: refresh browse + home + listing + seller dashboard. */
export function revalidateF1AfterConfirm(listingId: string): void {
  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/buy`);
    revalidatePath(`/${loc}/rent`);
    revalidatePath(`/${loc}/dashboard/listings`);
    revalidatePath(`/${loc}`);
    revalidatePath(`/${loc}/listing/${listingId}`);
  }
}

export function revalidateF1ListingOnly(listingId: string): void {
  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/listing/${listingId}`);
  }
}
