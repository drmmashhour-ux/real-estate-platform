import { ScreenChrome } from "../components/ui/ScreenChrome";
import { AIControlScreenContent } from "../screens/AIControlScreen";

export default function AiControlRoute() {
  return (
    <ScreenChrome title="AI autonomy" subtitle="Platform status from /api/ai/autonomy/status">
      <AIControlScreenContent />
    </ScreenChrome>
  );
}
