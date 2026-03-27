import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../../../components/ui/ScreenChrome";
import { colors } from "../../../../theme/colors";

/** Wire to POST /api/... review when mobile route is added; eligibility from booking detail. */
export default function WriteReview() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  return (
    <ScreenChrome title="Write a review" subtitle={`Booking ${reservationId}`}>
      <Text style={styles.t}>
        Submit stars + comment via the same validation as web BNHub reviews (completed stay, single review per booking).
      </Text>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  t: { color: colors.textMuted, lineHeight: 22 },
});
