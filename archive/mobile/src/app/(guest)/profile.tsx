import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { VerifiedUserBadge } from "../../components/VerifiedUserBadge";
import { GoldButton } from "../../components/ui/GoldButton";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { AUTH_DISABLED } from "../../config/dev";
import { useAppAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

export default function GuestProfile() {
  const { me, signOut, session, profileLoadFailed } = useAppAuth();

  if (AUTH_DISABLED) {
    return (
      <ScreenChrome title="Profile" subtitle="Development">
        <Text style={styles.body}>
          Auth checks are off (see src/config/dev.ts). Use the app freely; turn AUTH_DISABLED off to restore login and API
          profile.
        </Text>
        <GoldButton label="Home" onPress={() => router.push("/(tabs)")} />
      </ScreenChrome>
    );
  }

  if (!session) {
    return (
      <ScreenChrome title="Profile" subtitle="Guest mode">
        <Text style={styles.body}>Browse listings without an account.</Text>
        <GoldButton label="Home" onPress={() => router.push("/(tabs)")} />
      </ScreenChrome>
    );
  }

  if (profileLoadFailed) {
    return (
      <ScreenChrome title="Profile" subtitle="Could not load account">
        <Text style={styles.body}>Check your network and API settings.</Text>
        <GoldButton label="Sign out" onPress={() => void signOut().then(() => router.replace("/(guest)/home"))} />
      </ScreenChrome>
    );
  }

  if (!me) {
    return (
      <ScreenChrome title="Profile" subtitle="Loading…">
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </ScreenChrome>
    );
  }

  const idv = me.identityVerification;
  const showVerified = idv?.isVerified === true;

  return (
    <ScreenChrome title="Profile" subtitle="Account & sessions">
      <Text style={styles.t}>{me.user.email}</Text>
      <Text style={styles.m}>Role · {me?.appRole}</Text>
      {me.trust ? (
        <Text style={styles.trustLine}>
          Trust {me.trust.trustScore}/100 · {me.trust.totalStays} stay{me.trust.totalStays === 1 ? "" : "s"}
          {me.trust.rating != null && Number.isFinite(me.trust.rating)
            ? ` · host avg ${me.trust.rating.toFixed(1)}★`
            : ""}
          {me.trust.badges?.length ? ` · ${me.trust.badges.join(" · ")}` : ""}
        </Text>
      ) : null}
      {showVerified ? <VerifiedUserBadge /> : null}
      {!showVerified ? (
        <Text style={styles.verifyHint}>
          {idv?.verificationStatus === "pending"
            ? "ID verification in review."
            : idv?.verificationStatus === "rejected"
              ? "Verification needs a new ID photo."
              : "Verify your ID anytime — optional unless a host or booking amount requires it."}
        </Text>
      ) : null}
      <GoldButton
        label={showVerified ? "Verification details" : "Verify your identity"}
        onPress={() => router.push("/verify-identity")}
      />
      <View style={styles.spacer} />
      <GoldButton label="Sign out" onPress={() => void signOut().then(() => router.replace("/(guest)/home"))} />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 120 },
  t: { color: colors.text, fontSize: 18, fontWeight: "700" },
  m: { color: colors.textMuted, marginVertical: 12 },
  verifyHint: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  trustLine: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  spacer: { height: 14 },
});
