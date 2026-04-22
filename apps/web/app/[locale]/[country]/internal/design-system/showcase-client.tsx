"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";

import { brand } from "@/design-system/colors";
import { motion } from "@/design-system/motion";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, SeniorPrimaryButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Select } from "@/components/ui/Select";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCardFrame, SkeletonLine } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import {
  ActivityFeed,
  AiSuggestionPanel,
  ComparisonPanel,
  KpiCard,
  KpiStrip,
  PriorityList,
  QuickActionBar,
} from "@/components/ui/dashboard-widgets";
import { BestMatchBanner, SeniorCard, SeniorStepCard } from "@/components/ui/senior";

export function DesignSystemShowcase() {
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState(false);

  return (
    <div className="space-y-16 pb-24">
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Tokens"
          title="Brand snapshot"
          subtitle={`Gold ${brand.gold}, sidebar motion ~${motion.sidebarCollapse}ms.`}
        />
        <div className="flex flex-wrap gap-2">
          <Badge variant="verified">Verified</Badge>
          <Badge variant="pending">Pending</Badge>
          <Badge variant="bestMatch">Best match</Badge>
          <Badge variant="aiSuggested">AI suggested</Badge>
          <Badge variant="highPriority">High priority</Badge>
        </div>
      </section>

      <section className="space-y-6 rounded-[var(--ds-radius-xl)] border border-[#D9D9D2] bg-[#0B0B0B] p-8 text-white">
        <h2 className="text-xl font-semibold">Buttons (dark shell)</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="goldPrimary">Gold primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
        <SeniorPrimaryButton type="button">Senior primary</SeniorPrimaryButton>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Forms</h2>
        <div className="grid max-w-lg gap-4">
          <Input mode="light" placeholder="Light input" />
          <Input mode="dark" placeholder="Dark input" className="bg-[#151515]" />
          <Select>
            <option>Option A</option>
            <option>Option B</option>
          </Select>
          <Toggle label="Notifications" defaultChecked />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Alerts</h2>
        <div className="space-y-3">
          <Alert variant="info" title="Information">
            Short supporting copy.
          </Alert>
          <Alert variant="success" title="Saved" />
          <Alert variant="actionNeeded" title="Review required" action={<Button size="sm">Open</Button>} />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card hoverable>Default dark card</Card>
          <Card variant="dashboardPanel">Dashboard panel (light)</Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Table</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Residence</Th>
              <Th>Leads</Th>
              <Th className="text-right">Status</Th>
            </Tr>
          </THead>
          <TBody>
            <Tr>
              <Td>Demo</Td>
              <Td>12</Td>
              <Td className="text-right">
                <Badge variant="active">Active</Badge>
              </Td>
            </Tr>
          </TBody>
        </Table>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Tabs & tooltip</h2>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="a">
            <p className="text-sm text-[#5C5C57]">Tab A content</p>
          </TabsContent>
          <TabsContent value="b">
            <p className="text-sm text-[#5C5C57]">Tab B content</p>
          </TabsContent>
        </Tabs>
        <Tooltip label="Helpful hint for this control">
          <span className="text-sm text-[#5C5C57]">Label with info</span>
        </Tooltip>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Empty & skeleton</h2>
        <EmptyState title="No leads yet" description="New requests will appear here." defaultIcon="generic" />
        <SkeletonCardFrame />
        <SkeletonLine className="w-48" />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Dashboard widgets</h2>
        <KpiStrip>
          <KpiCard label="Leads" value={24} hint="Last 7 days" variant="light" />
          <KpiCard label="Visits" value={8} variant="light" />
        </KpiStrip>
        <PriorityList title="Priority" items={[]} />
        <ActivityFeed title="Activity" entries={[]} loading />
        <AiSuggestionPanel items={["Follow up with families waiting >24h"]} />
        <ComparisonPanel title="Comparison">
          <p className="text-sm text-[#5C5C57]">Table content…</p>
        </ComparisonPanel>
        <QuickActionBar>
          <Button size="sm" variant="goldPrimary">
            + Action
          </Button>
        </QuickActionBar>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Senior hub</h2>
        <SeniorCard title="Welcome" footer={<SeniorPrimaryButton>Continue</SeniorPrimaryButton>}>
          Clear, large body copy for readability.
        </SeniorCard>
        <SeniorStepCard step={1} title="Choose care needs">
          Fewer options per screen.
        </SeniorStepCard>
        <BestMatchBanner>Best match for your family — based on profile and availability.</BestMatchBanner>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Modal & drawer</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={() => setModal(true)}>
            Open modal
          </Button>
          <Button variant="outline" type="button" onClick={() => setDrawer(true)}>
            Open drawer
          </Button>
        </div>
        <Modal open={modal} title="Example" onClose={() => setModal(false)} footer={<Button onClick={() => setModal(false)}>OK</Button>}>
          <p className="text-sm">Concise modal body.</p>
        </Modal>
        <Drawer open={drawer} title="Side panel" onClose={() => setDrawer(false)} footer={<Button onClick={() => setDrawer(false)}>Done</Button>}>
          <p className="text-sm">Drawer content for mobile-first flows.</p>
        </Drawer>
      </section>

      <section className="rounded-xl border border-dashed border-[#D9D9D2] p-6 text-center text-sm text-[#5C5C57]">
        <Inbox className="mx-auto mb-2 h-8 w-8 opacity-40" aria-hidden />
        End of showcase — align new UI with tokens in <code className="rounded bg-[#F2F2EE] px-1">design-system/</code>
      </section>
    </div>
  );
}
