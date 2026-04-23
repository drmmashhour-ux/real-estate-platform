import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { colors } from "../../../theme/colors";

export default function BookingConfirm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenChrome title="Confirmation" subtitle="Booking ID placeholder">
      <Text style={styles.t}>
        Listing {id}: payment confirmation flows through existing BNHub Payment / Stripe — no fake success in production.
      </Text>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  t: { color: colors.textMuted, lineHeight: 22 },
});
