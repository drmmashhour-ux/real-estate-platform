import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { ScreenChrome } from "../../../../components/ui/ScreenChrome";
import { colors } from "../../../../theme/colors";

export default function HostListingPhotos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenChrome title="Photos" subtitle={id}>
      <Text style={{ color: colors.textMuted }}>Use image picker + signed upload (same pipeline as web BNHub).</Text>
    </ScreenChrome>
  );
}
