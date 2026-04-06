import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COUNTRY_OPTIONS, citiesForCountry } from "../../lib/locationMarkets";
import { colors } from "../../theme/colors";

type Props = {
  selectedCountry: string | null;
  selectedCity: string | null;
  onSelectCountry: (country: string | null) => void;
  onSelectCity: (city: string | null) => void;
};

export function LocationSelectors({
  selectedCountry,
  selectedCity,
  onSelectCountry,
  onSelectCity,
}: Props) {
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const cities = citiesForCountry(selectedCountry);
  const canPickCity = Boolean(selectedCountry);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Country</Text>
      <Pressable
        style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
        onPress={() => setCountryOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Choose country"
      >
        <Text style={styles.selectorText}>{selectedCountry ?? "Any country"}</Text>
        <Text style={styles.chev}>▾</Text>
      </Pressable>

      <Text style={[styles.label, styles.labelSp]}>City</Text>
      <Pressable
        style={({ pressed }) => [
          styles.selector,
          !canPickCity && styles.selectorDisabled,
          pressed && canPickCity && styles.pressed,
        ]}
        onPress={() => canPickCity && setCityOpen(true)}
        disabled={!canPickCity}
        accessibilityRole="button"
        accessibilityLabel="Choose city"
      >
        <Text style={[styles.selectorText, !canPickCity && styles.muted]}>
          {selectedCity ?? (canPickCity ? "Any city" : "Select a country first")}
        </Text>
        <Text style={[styles.chev, !canPickCity && styles.muted]}>▾</Text>
      </Pressable>

      <Modal visible={countryOpen} transparent animationType="fade" onRequestClose={() => setCountryOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCountryOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Country</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Pressable
                style={styles.option}
                onPress={() => {
                  onSelectCountry(null);
                  setCountryOpen(false);
                }}
              >
                <Text style={styles.optionText}>Any country</Text>
              </Pressable>
              {COUNTRY_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  style={styles.option}
                  onPress={() => {
                    onSelectCountry(c);
                    setCountryOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, selectedCountry === c && styles.optionOn]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={cityOpen} transparent animationType="fade" onRequestClose={() => setCityOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCityOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>City · {selectedCountry}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Pressable
                style={styles.option}
                onPress={() => {
                  onSelectCity(null);
                  setCityOpen(false);
                }}
              >
                <Text style={styles.optionText}>Any city</Text>
              </Pressable>
              {cities.map((city) => (
                <Pressable
                  key={city}
                  style={styles.option}
                  onPress={() => {
                    onSelectCity(city);
                    setCityOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, selectedCity === city && styles.optionOn]}>{city}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 6, letterSpacing: 0.4 },
  labelSp: { marginTop: 10 },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
  selectorText: { color: colors.text, fontSize: 16, fontWeight: "600", flex: 1 },
  muted: { color: colors.muted },
  chev: { color: colors.gold, fontSize: 14, marginLeft: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "52%",
    paddingBottom: 24,
  },
  sheetTitle: {
    color: colors.gold,
    fontWeight: "800",
    fontSize: 16,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  option: { paddingVertical: 16, paddingHorizontal: 20 },
  optionText: { color: colors.text, fontSize: 16 },
  optionOn: { color: colors.gold, fontWeight: "800" },
});
