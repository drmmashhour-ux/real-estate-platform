import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type PayoutResp = {
  stripeOnboardingComplete: boolean;
  payouts: unknown;
};

export default function HostPayoutStatus() {
  const q = useQuery({
    queryKey: ["host-payout-summary"],
    queryFn: () => mobileFetch<PayoutResp>("/api/mobile/v1/host/payout-summary"),
  });

  return (
    <ScreenChrome title="Payout status" subtitle="Stripe Connect · BNHub">
      {q.isLoading ? <Text style={styles.muted}>Loading…</Text> : null}
      {q.error ? <Text style={styles.err}>{(q.error as Error).message}</Text> : null}
      {q.data ? (
        <View style={styles.box}>
          <Text style={styles.row}>
            Stripe onboarding: {q.data.stripeOnboardingComplete ? "Complete" : "Incomplete"}
          </Text>
          <Text style={styles.muted}>
            Detailed payout rows mirror the web host dashboard. Funds typically release on the schedule set at payment
            (e.g. after check-in + escrow), when there is no active dispute.
          </Text>
          <Text style={styles.mono}>{JSON.stringify(q.data.payouts, null, 2).slice(0, 4000)}</Text>
        </View>
      ) : null}
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted, marginBottom: 8 },
  err: { color: colors.danger },
  box: { gap: 12 },
  row: { color: colors.text, fontWeight: "600" },
  mono: { color: colors.textMuted, fontSize: 11, fontFamily: "monospace" },
});
