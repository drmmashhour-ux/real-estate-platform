import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function HostReviews() {
  return (
    <ScreenChrome title="Reviews" subtitle="Respond · monitor trends">
      <Text style={{ color: colors.textMuted }}>Aggregate from `Review` for host listings — moderation uses `bnhub_review_moderation`.</Text>
    </ScreenChrome>
  );
}
