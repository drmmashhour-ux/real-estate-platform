import { BrokerDealConversionConsole } from "./BrokerDealConversionConsole";

/** @deprecated Use `BrokerDealConversionConsole` — same component; name kept for existing imports. */
export function BrokerClosingSection({ accent = "#10b981" }: { accent?: string }) {
  return <BrokerDealConversionConsole accent={accent} />;
}

export { BrokerDealConversionConsole } from "./BrokerDealConversionConsole";
