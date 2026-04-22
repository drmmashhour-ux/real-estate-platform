"use client";

import { SeniorLivingGuideWizard } from "@/components/senior-living/SeniorLivingGuideWizard";
import { SeniorVoiceFlow } from "./senior-voice-flow";

type Props = {
  locale: string;
  country: string;
  /** From URL e.g. ?sl_ab=voice */
  voiceFirst?: boolean;
};

/**
 * Tablet-first: one guided path plus optional voice-first ordering for experiments.
 */
export function SeniorGuidedFlow(props: Props) {
  if (props.voiceFirst) {
    return (
      <div className="mx-auto max-w-xl space-y-10">
        <SeniorVoiceFlow locale={props.locale} country={props.country} compact />
        <div>
          <p className="text-center text-lg font-semibold text-neutral-700">or tap step by step</p>
          <SeniorLivingGuideWizard locale={props.locale} country={props.country} />
        </div>
      </div>
    );
  }
  return <SeniorLivingGuideWizard locale={props.locale} country={props.country} />;
}
