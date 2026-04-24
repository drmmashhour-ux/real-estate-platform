"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Shield, Pause, Play, Power } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Agent {
  id: string;
  name: string;
  domain: string;
  status: "ACTIVE" | "PAUSED";
  performanceScore: number;
  _count: { strategies: number };
}

interface Props {
  agents: Agent[];
  onStatusChange?: () => void;
}

export function AgentRankingsTable({ agents, onStatusChange }: Props) {
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleStatus(agent: Agent) {
    setToggling(agent.id);
    try {
      const nextStatus = agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      await fetch("/api/agents/status", {
        method: "POST",
        body: JSON.stringify({ agentId: agent.id, status: nextStatus }),
      });
      onStatusChange?.();
    } catch (err) {
      console.error("Failed to toggle agent status", err);
    } finally {
      setToggling(null);
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center">
          <Brain className="w-5 h-5 text-purple-500 mr-2" />
          AI Agent Rankings
        </h3>
        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
          Independent Learning
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <th className="p-4 font-semibold">Agent Name</th>
              <th className="p-4 font-semibold">Domain</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Strategies</th>
              <th className="p-4 font-semibold text-right">Performance</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="p-4 font-medium text-white">{agent.name}</td>
                <td className="p-4">
                  <Badge variant="outline" className="text-[10px] uppercase border-zinc-700">
                    {agent.domain}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    {agent.status === "ACTIVE" ? (
                      <span className="flex items-center text-green-500">
                        <Play className="w-3 h-3 mr-1 fill-current" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="flex items-center text-zinc-500">
                        <Pause className="w-3 h-3 mr-1 fill-current" />
                        PAUSED
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-zinc-400 tabular-nums">
                  {agent._count.strategies}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-500" 
                        style={{ width: `${agent.performanceScore * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-bold tabular-nums">
                      {(agent.performanceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${agent.status === "ACTIVE" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                    onClick={() => toggleStatus(agent)}
                    disabled={toggling === agent.id}
                  >
                    <Power className={`w-4 h-4 ${toggling === agent.id ? "animate-pulse" : ""}`} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
