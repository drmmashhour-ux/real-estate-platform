import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function AdminReviews() {
  return (
    <ScreenChrome title="Review moderation" subtitle="VISIBLE / PENDING / HIDDEN">
      <Text style={{ color: colors.textMuted }}>Table `bnhub_review_moderation` + abuse reports.</Text>
    </ScreenChrome>
  );
}
