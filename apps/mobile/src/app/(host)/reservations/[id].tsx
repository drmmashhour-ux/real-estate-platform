import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { colors } from "../../../theme/colors";

export default function HostReservationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenChrome title="Reservation" subtitle={id}>
      <Text style={{ color: colors.textMuted }}>Host-side booking detail + messaging hooks (web parity).</Text>
    </ScreenChrome>
  );
}
