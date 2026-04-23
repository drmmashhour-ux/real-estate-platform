import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { colors } from "../../../theme/colors";

export default function AdminListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenChrome title="Listing moderation" subtitle={id}>
      <Text style={{ color: colors.textMuted }}>Restrict / lock publication — POST handlers to add next to web admin actions.</Text>
    </ScreenChrome>
  );
}
