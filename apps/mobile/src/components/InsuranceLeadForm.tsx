import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../config";
import { colors } from "../theme/colors";

/** Keep in sync with `apps/web/lib/insurance/consent-text.ts`. */
const INSURANCE_LEAD_CONSENT_LABEL =
  "I agree to be contacted by a licensed insurance broker regarding my request. You may be contacted by a licensed insurance broker.";

const TRUST_LINE =
  "Free quote · No obligation · Licensed Québec broker partners · Limited-time partner offers may apply.";

const CTA_PRIMARY = "Get your free insurance quote in 30 seconds";

export type MobileInsuranceLeadType = "travel" | "property" | "mortgage";
export type MobileInsuranceLeadSource = "bnbhub" | "listing" | "checkout" | "manual";

type Props = {
  leadType: MobileInsuranceLeadType;
  source: MobileInsuranceLeadSource;
  listingId?: string;
  bookingId?: string;
  headline?: string;
  subheadline?: string;
  variant?: "A" | "B";
};

function trackMobile(
  eventName: "lead_form_viewed" | "lead_started" | "lead_submitted" | "lead_failed",
  params: {
    source: MobileInsuranceLeadSource;
    leadType?: MobileInsuranceLeadType;
    variantId?: string;
  }
) {
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/api/insurance/leads/track`;
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        eventName,
        source: params.source,
        leadType: params.leadType,
        variantId: params.variantId,
        device: "mobile",
      }),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export function InsuranceLeadForm({
  leadType,
  source,
  listingId,
  bookingId,
  headline,
  subheadline,
  variant = "A",
}: Props) {
  const variantId = variant;
  const showPhoneUpFront = variant === "B";

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [enrichPhone, setEnrichPhone] = useState("");
  const [enrichBusy, setEnrichBusy] = useState(false);
  const [enrichDone, setEnrichDone] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  const startedTracked = useRef(false);

  useEffect(() => {
    trackMobile("lead_form_viewed", { source, leadType, variantId });
  }, [source, leadType, variantId]);

  const onEmailFocus = useCallback(() => {
    if (startedTracked.current) return;
    startedTracked.current = true;
    trackMobile("lead_started", { source, leadType, variantId });
  }, [source, leadType, variantId]);

  async function submit() {
    setError(null);
    if (!consent) {
      setError("Please confirm you agree to be contacted by an insurance partner.");
      return;
    }
    setSubmitting(true);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/insurance/leads`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-insurance-device": "mobile",
        },
        body: JSON.stringify({
          email: email.trim(),
          phone: showPhoneUpFront ? phone.trim() || undefined : undefined,
          fullName: fullName.trim() || undefined,
          message: message.trim() || undefined,
          leadType,
          source,
          listingId: listingId ?? undefined,
          bookingId: bookingId ?? undefined,
          consentGiven: true,
          variantId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; leadId?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setLeadId(typeof data.leadId === "string" ? data.leadId : null);
      setDone(true);
    } catch {
      setError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      trackMobile("lead_failed", { source, leadType, variantId });
    } finally {
      setSubmitting(false);
    }
  }

  async function enrichSubmit() {
    if (!leadId || !enrichPhone.trim()) return;
    setEnrichBusy(true);
    setError(null);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/insurance/leads/${encodeURIComponent(leadId)}/enrich`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: enrichPhone.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(typeof data.error === "string" ? data.error : "Could not save phone.");
        return;
      }
      setEnrichDone(true);
    } catch {
      setError("Network error saving phone.");
    } finally {
      setEnrichBusy(false);
    }
  }

  if (done) {
    return (
      <View style={styles.cardOk}>
        <Text style={styles.okTitle}>Thank you — you’re on the list.</Text>
        <Text style={styles.okBody}>A licensed insurance partner may reach out using the email you provided.</Text>
        {!showPhoneUpFront && leadId && !enrichDone ? (
          <View style={styles.enrichBox}>
            <Text style={styles.enrichLabel}>Optional: add phone for a faster callback</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              value={enrichPhone}
              onChangeText={setEnrichPhone}
            />
            <Pressable
              onPress={() => void enrichSubmit()}
              disabled={enrichBusy || !enrichPhone.trim()}
              style={({ pressed }) => [styles.enrichCta, (pressed || enrichBusy) && { opacity: 0.88 }]}
            >
              <Text style={styles.enrichCtaLabel}>{enrichBusy ? "Saving…" : "Save phone"}</Text>
            </Pressable>
          </View>
        ) : null}
        {enrichDone ? <Text style={styles.enrichDone}>Phone saved — thank you.</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {headline ? <Text style={styles.headline}>{headline}</Text> : null}
      {subheadline ? <Text style={styles.sub}>{subheadline}</Text> : null}
      <Text style={styles.trust}>{TRUST_LINE}</Text>
      <Text style={styles.urgency}>Limited-time partner offer · No obligation</Text>
      <Text style={styles.label}>
        Email <Text style={styles.req}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        onFocus={onEmailFocus}
      />
      {showPhoneUpFront ? (
        <>
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </>
      ) : null}
      <Pressable onPress={() => setShowExtras(!showExtras)} style={styles.extrasToggle}>
        <Text style={styles.extrasToggleText}>{showExtras ? "Hide" : "Add"} name or message (optional)</Text>
      </Pressable>
      {showExtras ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Message"
            placeholderTextColor={colors.muted}
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </>
      ) : null}
      <Pressable
        onPress={() => setConsent(!consent)}
        style={styles.consentRow}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
      >
        <View style={[styles.checkbox, consent && styles.checkboxOn]}>
          {consent ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={styles.consentText}>{INSURANCE_LEAD_CONSENT_LABEL}</Text>
      </Pressable>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable
        onPress={() => void submit()}
        disabled={submitting}
        style={({ pressed }) => [styles.cta, (pressed || submitting) && styles.ctaPressed]}
      >
        {submitting ? (
          <ActivityIndicator color="#0a0a0a" />
        ) : (
          <Text style={styles.ctaLabel}>{CTA_PRIMARY}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  cardOk: {
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  okTitle: { color: colors.success, fontWeight: "700", fontSize: 15 },
  okBody: { color: colors.muted, fontSize: 13, marginTop: 8, lineHeight: 20 },
  enrichBox: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(34,197,94,0.25)" },
  enrichLabel: { color: colors.success, fontSize: 12, fontWeight: "600" },
  enrichCta: {
    marginTop: 10,
    backgroundColor: "rgba(22,163,74,0.9)",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  enrichCtaLabel: { color: "#fff", fontWeight: "800", fontSize: 13 },
  enrichDone: { marginTop: 10, color: colors.muted, fontSize: 12 },
  headline: { color: colors.gold, fontWeight: "700", fontSize: 15 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  trust: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 10 },
  urgency: {
    color: colors.goldDim,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 6,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 12 },
  req: { color: colors.gold },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.surface2,
  },
  textarea: { minHeight: 64, textAlignVertical: "top" },
  extrasToggle: { marginTop: 12 },
  extrasToggleText: { color: colors.gold, fontSize: 12, fontWeight: "600" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 14 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: { borderColor: colors.gold, backgroundColor: "rgba(212,175,55,0.15)" },
  checkMark: { color: colors.gold, fontWeight: "900", fontSize: 14 },
  consentText: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 17 },
  err: { color: colors.danger, fontSize: 12, marginTop: 10 },
  cta: {
    marginTop: 16,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.88 },
  ctaLabel: { color: "#0a0a0a", fontWeight: "800", fontSize: 14, textAlign: "center", paddingHorizontal: 8 },
});
