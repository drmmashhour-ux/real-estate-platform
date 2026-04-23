import { Link } from "expo-router";
import { Text } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { colors } from "../../../theme/colors";

export default function HostReservations() {
  return (
    <ScreenChrome title="Reservations" subtitle="Same data as calendar — drill into guest">
      <Text style={{ color: colors.textMuted }}>
        Open calendar for list; per-reservation detail uses booking id from host booking API (extend `/api/mobile/v1/host/bookings`).
      </Text>
      <Link href="/(host)/calendar" style={{ marginTop: 16 }}>
        <Text style={{ color: colors.gold }}>Open calendar</Text>
      </Link>
    </ScreenChrome>
  );
}
