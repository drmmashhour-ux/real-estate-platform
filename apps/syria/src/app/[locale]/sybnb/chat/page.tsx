import { redirect } from "next/navigation";

/**
 * QA / docs alias — ultra-lite chat lives under `/[locale]/lite/chat`.
 */
export default async function SybnbChatAliasPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  redirect(`/${locale}/lite/chat`);
}
