import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function AdminSafety() {
  return (
    <ScreenChrome title="Safety review" subtitle="Policy engine · no public danger labels">
      <Text style={{ color: colors.textMuted }}>
        `bnhub_listing_safety_profiles` + `bnhub_safety_flags` + audit log. Full evidence UI remains web admin only.
      </Text>
    </ScreenChrome>
  );
}
