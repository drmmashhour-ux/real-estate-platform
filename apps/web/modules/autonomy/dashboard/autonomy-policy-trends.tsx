"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Legend,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

type PolicyTrendData = {
  date: string;
  allowed: number;
  blocked: number;
  approvalRequired: number;
  executed: number;
};

type DomainDecision = {
  domain: string;
  count: number;
};

export const AutonomyPolicyTrends: React.FC = () => {
  const [data, setData] = useState<PolicyTrendData[]>([]);
  const [domainDecisions, setDomainDecisions] = useState<DomainDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDecisions: 0,
    blockRate: 0,
  });

  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f1f5f9'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/autonomy/policy-trends");
        const json = await res.json();
        setData(json.trends);
        setDomainDecisions(json.domainDecisions);
        setStats({
          totalDecisions: json.totalDecisions,
          blockRate: json.blockRate,
        });
      } catch (error) {
        console.error("Failed to fetch policy trends", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <Card className="p-12 text-center text-slate-400 border-slate-200">
      <Activity className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
      Analyzing policy trends...
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Existing Charts... */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Decision Outcomes Over Time</h3>
          </div>
          <Badge variant="outline" className="text-slate-500">Last 7 Days</Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: "#94a3b8"}}
                tickFormatter={(str) => str.split("-").slice(1).join("/")}
              />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: "#94a3b8"}} />
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              />
              <Legend iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="allowed" 
                name="Total Allowed"
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAllowed)" 
              />
              <Area 
                type="monotone" 
                dataKey="blocked" 
                name="Policy Blocked"
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBlocked)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Human Intervention Frequency</h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <TrendingUp className="w-3 h-3 text-green-500" /> 
            {stats.totalDecisions} total decisions
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: "#94a3b8"}}
                tickFormatter={(str) => str.split("-").slice(1).join("/")}
              />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: "#94a3b8"}} />
              <Tooltip 
                cursor={{fill: "#f8fafc"}}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              />
              <Legend iconType="circle" />
              <Bar 
                dataKey="approvalRequired" 
                name="Approval Required"
                fill="#818cf8" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
              <Bar 
                dataKey="executed" 
                name="Auto-Executed"
                fill="#e2e8f0" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <PieChartIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Decisions by Domain</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={domainDecisions}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="domain"
              >
                {domainDecisions.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Action Outcomes Rate</h3>
        </div>
        <div className="h-64 w-full flex flex-col justify-center items-center">
          <div className="text-5xl font-black text-indigo-600 mb-2">
            {(stats.totalDecisions > 0 ? (stats.totalDecisions - (data.reduce((acc, d) => acc + d.blocked, 0))) / stats.totalDecisions * 100 : 100).toFixed(1)}%
          </div>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">System Efficiency Rate</p>
          <div className="mt-8 w-full max-w-xs space-y-3">
             <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Volume</span>
                <span className="text-slate-800 font-black">{stats.totalDecisions}</span>
             </div>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full" style={{ width: '100%' }} />
             </div>
             <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Policy Compliant</span>
                <span className="text-emerald-600 font-black">{stats.totalDecisions - data.reduce((acc, d) => acc + d.blocked, 0)}</span>
             </div>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${(stats.totalDecisions > 0 ? (stats.totalDecisions - (data.reduce((acc, d) => acc + d.blocked, 0))) / stats.totalDecisions * 100 : 100)}%` }} />
             </div>
          </div>
        </div>
      </Card>

      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Decisions</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalDecisions}</p>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Block Rate</p>
            <p className="text-2xl font-black text-slate-800">{(stats.blockRate * 100).toFixed(1)}%</p>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Autonomy Score</p>
            <p className="text-2xl font-black text-slate-800">{(100 - stats.blockRate * 100).toFixed(0)}/100</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
