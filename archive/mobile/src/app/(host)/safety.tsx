import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function HostSafety() {
  return (
    <ScreenChrome title="Safety requirements" subtitle="Verification & policy tasks">
      <Text style={{ color: colors.textMuted }}>
        Surfaces `bnhub_listing_safety_profiles` flags (exterior photo, ID match, manual location) without exposing internal evidence text on
        mobile.
      </Text>
    </ScreenChrome>
  );
}
