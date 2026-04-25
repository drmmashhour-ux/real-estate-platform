import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function FieldSpecialistContractTemplate() {
  return (
    <Card variant="default" className="border-white/10 bg-[#121212]">
      <CardHeader>
        <CardTitle className="text-lg text-white">Field Demo Specialist Agreement</CardTitle>
        <p className="text-xs text-white/50">Template for HR / contracting — not a substitute for legal review.</p>
      </CardHeader>
      <CardContent className="prose prose-invert max-w-none text-sm text-white/80">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong className="text-white">Role.</strong> The specialist conducts in-person or virtual product demonstrations of
            LECIPM to licensed real estate brokers, follows the approved demo script, and logs outcomes as directed by management.
          </li>
          <li>
            <strong className="text-white">No legal advice.</strong> The specialist must not provide legal, regulatory, tax, or
            investment advice. Questions in those areas are referred to the broker&apos;s professional advisors or LECIPM
            compliance channels.
          </li>
          <li>
            <strong className="text-white">Confidentiality.</strong> The specialist will protect non-public information about
            LECIPM, brokers met in the field, pipeline data, and compensation structures. No sharing of credentials, internal
            dashboards, or broker lists outside approved tools.
          </li>
          <li>
            <strong className="text-white">Compensation.</strong> Compensation may include base amounts and variable bonuses tied
            to verified demos completed and brokers activated according to the schedule communicated separately in writing.
          </li>
          <li>
            <strong className="text-white">Conduct.</strong> The specialist represents LECIPM professionally, avoids
            overstating product capabilities, and escalates incidents or disputes to the outreach lead without engaging in
            arguments with prospects.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
