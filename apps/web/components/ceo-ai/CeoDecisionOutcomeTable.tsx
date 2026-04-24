"use client";
import React from "react";
import { CheckCircle2, XCircle, MinusCircle, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CeoDecisionOutcomeTableProps {
  decisions: any[];
}

export function CeoDecisionOutcomeTable({ decisions }: CeoDecisionOutcomeTableProps) {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Decision</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decisions.map((d) => {
            const outcome = d.outcomes?.[0];
            return (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{d.decisionType}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{d.domain}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${d.confidence * 100}%` }} 
                      />
                    </div>
                    <span className="text-xs">{(d.confidence * 100).toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {!outcome ? (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 gap-1">
                      <MinusCircle className="h-3 w-3" />
                      Pending
                    </Badge>
                  ) : outcome.resultLabel === "POSITIVE" ? (
                    <Badge className="bg-emerald-500 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Positive
                    </Badge>
                  ) : outcome.resultLabel === "NEGATIVE" ? (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Negative
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 gap-1">
                      <MinusCircle className="h-3 w-3" />
                      Neutral
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {outcome ? (
                    <span className={outcome.impactScore > 0 ? "text-emerald-600 font-bold" : outcome.impactScore < 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                      {outcome.impactScore > 0 ? "+" : ""}{outcome.impactScore.toFixed(2)}
                    </span>
                  ) : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
