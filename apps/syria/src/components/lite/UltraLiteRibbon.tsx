"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { LiteModePreference } from "@/lib/lite/lite-mode-client";
import { useSyriaMode, useSwitchSyriaToFullVersion } from "@/context/ModeContext";

function UltraLiteManualControlsRibbon() {
  const t = useTranslations("UltraLite");
  const { preference, setPreference } = useSyriaMode();

  return (
    <label className="mt-1 flex flex-col gap-1 text-[10px] text-neutral-800">
      <span>{t("liteControl")}</span>
      <select
        value={preference}
        className="rounded border border-neutral-300 bg-white px-1 py-0 text-[11px]"
        onChange={(e) => setPreference(e.target.value as LiteModePreference)}
      >
        <option value="auto">{t("modeAuto")}</option>
        <option value="on">{t("modeOn")}</option>
        <option value="off">{t("modeOff")}</option>
      </select>
    </label>
  );
}

export function UltraLiteRibbon(props: { litePath?: boolean }) {
  const { litePath = false } = props;
  const pathname = usePathname() ?? "";

  const t = useTranslations("UltraLite");
  const ctx = useSyriaMode();
  const switchFull = useSwitchSyriaToFullVersion();

  const showSuggest = Boolean(ctx.suggestFullVersion && ctx.preference === "auto");

  if (!(litePath || pathname.startsWith("/lite") || ctx.effectiveMode === "lite")) return null;

  return (
    <div
      role="note"
      className={`mb-2 rounded border px-2 py-1 ${litePath ? "border-amber-400 bg-amber-50 text-amber-950" : "border-neutral-300 bg-neutral-100 text-neutral-900"}`}
    >
      <p className="text-[11px] font-semibold">⚡ {t("liteModeRibbonTitle")}</p>

      {litePath ? (
        <>
          <p className="mt-1 text-[10px]">
            <button
              type="button"
              className="font-semibold text-sky-900 underline decoration-sky-800"
              onClick={() => switchFull()}
            >
              {t("switchToFullVersion")}
            </button>
          </p>
          {showSuggest ? (
            <p className="mt-1 text-[10px] text-neutral-800">
              {t("suggestNetworkImproved")}{" "}
              <button type="button" className="text-neutral-700 underline" onClick={() => ctx.dismissSuggest()}>
                {t("dismiss")}
              </button>
            </p>
          ) : null}
        </>
      ) : null}

      {!litePath && ctx.effectiveMode === "lite" ? (
        <p className="mt-1 text-[10px]">
          <Link href="/lite" className="font-semibold text-sky-900 underline">
            {t("openLiteHint")}
          </Link>
        </p>
      ) : null}

      <UltraLiteManualControlsRibbon />
    </div>
  );
}
