import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoldButton } from "../ui/GoldButton";
import { colors } from "../../theme/colors";

/** Tokens aligned with `PublicListingsQuery.propertyType` / Supabase filter layer. */
export const PROPERTY_TYPE_OPTIONS: { label: string; token: string }[] = [
  { label: "Apartment", token: "apartment" },
  { label: "Villa", token: "villa" },
  { label: "Hotel", token: "hotel" },
  { label: "Luxury", token: "luxury" },
  { label: "Private room", token: "room" },
  { label: "Studio", token: "studio" },
  { label: "Motel", token: "motel" },
  { label: "Shared room", token: "shared_room" },
];

export const AMENITY_OPTIONS = [
  "Wi‑Fi",
  "Kitchen",
  "Parking",
  "Pool",
  "Air conditioning",
  "Washer",
  "Pet friendly",
  "Gym",
  "Beach access",
  "Hot tub",
] as const;

export type AppliedAdvancedFilters = {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  minRating?: number;
  amenities: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  initial: AppliedAdvancedFilters;
  onApply: (next: AppliedAdvancedFilters) => void;
  onReset: () => void;
};

export function SearchFiltersModal({ visible, onClose, initial, onApply, onReset }: Props) {
  const [propertyType, setPropertyType] = useState<string | undefined>(initial.propertyType);
  const [minPrice, setMinPrice] = useState(initial.minPrice != null ? String(initial.minPrice) : "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice != null ? String(initial.maxPrice) : "");
  const [guests, setGuests] = useState(initial.guests != null ? String(initial.guests) : "");
  const [bedrooms, setBedrooms] = useState(initial.bedrooms != null ? String(initial.bedrooms) : "");
  const [bathrooms, setBathrooms] = useState(initial.bathrooms != null ? String(initial.bathrooms) : "");
  const [minRating, setMinRating] = useState(initial.minRating != null ? String(initial.minRating) : "");
  const [amenities, setAmenities] = useState<string[]>(() => [...initial.amenities]);

  function parseNum(s: string): number | undefined {
    const t = s.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  function parseIntOpt(s: string): number | undefined {
    const t = s.trim();
    if (!t) return undefined;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function apply() {
    const next: AppliedAdvancedFilters = {
      propertyType: propertyType || undefined,
      minPrice: parseNum(minPrice),
      maxPrice: parseNum(maxPrice),
      guests: parseIntOpt(guests),
      bedrooms: parseIntOpt(bedrooms),
      bathrooms: parseNum(bathrooms),
      minRating: parseIntOpt(minRating),
      amenities: [...amenities],
    };
    onApply(next);
    onClose();
  }

  function reset() {
    setPropertyType(undefined);
    setMinPrice("");
    setMaxPrice("");
    setGuests("");
    setBedrooms("");
    setBathrooms("");
    setMinRating("");
    setAmenities([]);
    onReset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Property type</Text>
          <View style={styles.wrap}>
            {PROPERTY_TYPE_OPTIONS.map((o) => {
              const on = propertyType === o.token;
              return (
                <Pressable
                  key={o.token}
                  onPress={() => setPropertyType(on ? undefined : o.token)}
                  style={[styles.pill, on && styles.pillOn]}
                >
                  <Text style={[styles.pillLabel, on && styles.pillLabelOn]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>Price (/night)</Text>
          <View style={styles.row2}>
            <TextInput
              style={styles.input}
              placeholder="Min"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={styles.sep}>—</Text>
            <TextInput
              style={styles.input}
              placeholder="Max"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>

          <Text style={styles.section}>Guests</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="Minimum guests"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={guests}
            onChangeText={setGuests}
          />

          <Text style={styles.section}>Bedrooms / bathrooms</Text>
          <View style={styles.row2}>
            <TextInput
              style={styles.input}
              placeholder="Beds min"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={bedrooms}
              onChangeText={setBedrooms}
            />
            <Text style={styles.sep} />
            <TextInput
              style={styles.input}
              placeholder="Baths min"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={bathrooms}
              onChangeText={setBathrooms}
            />
          </View>

          <Text style={styles.section}>Minimum guest rating (1–5)</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="e.g. 4"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={minRating}
            onChangeText={setMinRating}
          />

          <Text style={styles.section}>Amenities</Text>
          {AMENITY_OPTIONS.map((a) => {
            const on = amenities.includes(a);
            return (
              <Pressable key={a} style={styles.checkRow} onPress={() => toggleAmenity(a)}>
                <View style={[styles.checkbox, on && styles.checkboxOn]}>
                  {on ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.checkLabel}>{a}</Text>
              </Pressable>
            );
          })}

          <View style={styles.btnBlock}>
            <GoldButton label="Apply filters" onPress={apply} />
            <View style={{ height: 12 }} />
            <Pressable onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetLabel}>Reset all</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  close: { color: colors.gold, fontWeight: "700", fontSize: 16 },
  scroll: { padding: 20, paddingBottom: 40 },
  section: {
    color: colors.gold,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  pillOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  pillLabel: { color: colors.text, fontWeight: "600", fontSize: 13 },
  pillLabelOn: { color: "#0a0a0a" },
  row2: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  inputFull: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  sep: { color: colors.muted, width: 16, textAlign: "center" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.goldDim,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.gold },
  checkmark: { color: "#0a0a0a", fontSize: 12, fontWeight: "900" },
  checkLabel: { color: colors.text, fontSize: 15 },
  btnBlock: { marginTop: 28 },
  resetBtn: { alignItems: "center", paddingVertical: 14 },
  resetLabel: { color: colors.muted, fontWeight: "700", fontSize: 15 },
});
