import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { ScreenChrome } from "../../../../components/ui/ScreenChrome";
import { colors } from "../../../../theme/colors";

export default function HostListingCheckin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenChrome title="Check-in / out" subtitle={id}>
      <Text style={{ color: colors.textMuted }}>
        Times, self check-in, quiet hours, early/late policies — same fields as web listing editor.
      </Text>
    </ScreenChrome>
  );
}
