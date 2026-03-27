import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type Ern = {
  summary: { grossBookingValueCents: number; estimatedHostPayoutCents: number; bookingCount: number };
  disclaimer: string;
};

export default function HostEarnings() {
  const q = useQuery({
    queryKey: ["host-earn"],
    queryFn: () => mobileFetch<Ern>("/api/mobile/v1/host/earnings"),
  });
  const s = q.data?.summary;
  return (
    <ScreenChrome title="Earnings" subtitle="Gross vs estimated payout">
      {s ? (
        <>
          <Text style={styles.big}>${(s.estimatedHostPayoutCents / 100).toFixed(2)}</Text>
          <Text style={styles.m}>Est. payout · {s.bookingCount} bookings</Text>
          <Text style={styles.m}>Gross booking value ${(s.grossBookingValueCents / 100).toFixed(2)}</Text>
        </>
      ) : (
        <Text style={styles.m}>Loading…</Text>
      )}
      <Text style={styles.small}>{q.data?.disclaimer}</Text>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  big: { color: colors.gold, fontSize: 32, fontWeight: "800" },
  m: { color: colors.textMuted, marginTop: 8 },
  small: { color: colors.textMuted, fontSize: 11, marginTop: 24 },
});
