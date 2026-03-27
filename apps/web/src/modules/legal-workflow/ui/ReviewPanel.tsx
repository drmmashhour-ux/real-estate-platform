import { ApprovalActionsBar } from "@/src/modules/legal-workflow/ui/ApprovalActionsBar";
import { AIInsightsPanel } from "@/src/modules/legal-workflow/ui/AIInsightsPanel";
import { AuditTimeline } from "@/src/modules/legal-workflow/ui/AuditTimeline";
import { CommentBox } from "@/src/modules/legal-workflow/ui/CommentBox";
import { DocumentSummaryCard } from "@/src/modules/legal-workflow/ui/DocumentSummaryCard";
import { SectionReviewPanel } from "@/src/modules/legal-workflow/ui/SectionReviewPanel";
import { ValidationIssuesList } from "@/src/modules/legal-workflow/ui/ValidationIssuesList";

type Props = {
  document: any | null;
  property: string;
  validation: any;
  sectionStatuses: any[];
  aiSummary: Record<string, unknown> | null;
  knowledgeRiskHints?: Array<{ content: string; sourceTitle: string; importance: string; pageNumber: number | null }>;
  audit: any[];
  comments: any[];
  onApprove: () => void;
  onRequestChanges: () => void;
  onFlagRisk: () => void;
  onAddComment: (text: string, sectionKey?: string) => void;
};

export function ReviewPanel({ document, property, validation, sectionStatuses, aiSummary, knowledgeRiskHints, audit, comments, onApprove, onRequestChanges, onFlagRisk, onAddComment }: Props) {
  return (
    <div className="space-y-3">
      <DocumentSummaryCard document={document} property={property} />
      <ApprovalActionsBar onApprove={onApprove} onRequestChanges={onRequestChanges} onFlagRisk={onFlagRisk} />
      <ValidationIssuesList issues={validation} />
      <AIInsightsPanel aiSummary={aiSummary} knowledgeRiskHints={knowledgeRiskHints} />
      <SectionReviewPanel sectionStatuses={sectionStatuses} />
      <CommentBox comments={comments} onSubmit={onAddComment} />
      <AuditTimeline items={audit} />
    </div>
  );
}
