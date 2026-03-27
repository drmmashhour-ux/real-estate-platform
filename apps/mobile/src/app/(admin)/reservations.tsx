import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function AdminReservations() {
  return (
    <ScreenChrome title="Bookings oversight" subtitle="Disputes · conflicts">
      <Text style={{ color: colors.textMuted }}>Filter `Booking.status = DISPUTED` and host/guest messaging — extend mobile API.</Text>
    </ScreenChrome>
  );
}
