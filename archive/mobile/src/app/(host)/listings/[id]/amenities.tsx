import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { ScreenChrome } from "../../../../components/ui/ScreenChrome";
import { colors } from "../../../../theme/colors";

export default function HostListingAmenities() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenChrome title="Amenities" subtitle={id}>
      <Text style={{ color: colors.textMuted }}>Multi-select tied to `ShortTermListing.amenities` JSON.</Text>
    </ScreenChrome>
  );
}
