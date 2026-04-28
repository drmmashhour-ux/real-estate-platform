import { getTranslations } from "next-intl/server";
import { LiteChatClient } from "@/components/lite/LiteChatClient";

export default async function UltraLiteChatPage() {
  const t = await getTranslations("UltraLite");
  return (
    <div>
      <h1 className="text-base font-bold text-neutral-900">{t("chatTitle")}</h1>
      <LiteChatClient />
    </div>
  );
}
