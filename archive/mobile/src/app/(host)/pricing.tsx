import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function HostPricing() {
  return (
    <ScreenChrome title="Dynamic pricing" subtitle="BNHub engine recommendations">
      <Text style={{ color: colors.textMuted }}>
        Recommended/min/max from `bnhub_dynamic_pricing_profiles` — see host listings API. Autopricing apply stays server-gated.
      </Text>
    </ScreenChrome>
  );
}
