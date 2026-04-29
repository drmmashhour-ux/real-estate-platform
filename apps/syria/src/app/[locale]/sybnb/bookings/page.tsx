import { redirect } from "next/navigation";

/**
 * QA / docs alias — booking requests list lives under `/[locale]/lite/requests`.
 * Detail pages remain at `/[locale]/sybnb/bookings/[id]`.
 */
export default async function SybnbBookingsListAliasPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  redirect(`/${locale}/lite/requests`);
}
