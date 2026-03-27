import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function AdminSettings() {
  return (
    <ScreenChrome title="Settings" subtitle="Mobile admin">
      <Text style={{ color: colors.textMuted }}>Feature flags & env are server-side only.</Text>
    </ScreenChrome>
  );
}
