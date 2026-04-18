import type { SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";

type Props = { scenario: SimulationScenarioResult };

export function ScenarioStepsTable({ scenario }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500">
            <th className="py-2 pr-2">Step</th>
            <th className="py-2 pr-2">Status</th>
            <th className="py-2 pr-2">Route / service</th>
            <th className="py-2 pr-2">Evidence</th>
          </tr>
        </thead>
        <tbody className="text-zinc-400">
          {scenario.steps.map((st) => (
            <tr key={st.stepId} className="border-b border-zinc-800/80">
              <td className="py-2 pr-2 align-top text-white">{st.title}</td>
              <td className="py-2 pr-2 align-top font-mono text-xs">{st.status}</td>
              <td className="max-w-[200px] py-2 pr-2 align-top font-mono text-xs break-all">{st.routeOrService}</td>
              <td className="max-w-md py-2 align-top text-xs break-words">{st.evidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
