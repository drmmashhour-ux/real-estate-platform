import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function HostQuality() {
  return (
    <ScreenChrome title="Quality & trust" subtitle="Star estimate · luxury tier · trust band">
      <Text style={{ color: colors.textMuted }}>
        Loads same summaries as `/bnhub/host/quality` web — connect listing picker + `/api/mobile/v1/host/listings` trust fields
        (already include hostTrust + pricingRecommendation).
      </Text>
    </ScreenChrome>
  );
}
