"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  Trophy,
  Globe2,
  ArrowRight,
  Smartphone,
  Flame,
  Activity,
} from "lucide-react";
import { Counter } from "./counter";
import { formatCurrency } from "@/lib/utils";

export interface DashboardData {
  totalLeads: number;
  pipelineValue: number;
  wonCount: number;
  wonValue: number;
  noSiteCount: number;
  conversionRate: number;
  funnel: { name: string; count: number; value: number; color: string }[];
  recent: { id: string; company_name: string; segment: string | null; value: number; stage: string; color: string }[];
  chips: { total: number; active: number; warming: number; avgHealth: number; sentToday: number; capacity: number };
}

export function DashboardView({ data }: { data: DashboardData }) {
  const maxCount = Math.max(...data.funnel.map((f) => f.count), 1);

  const kpis = [
    {
      label: "Leads na base",
      value: <Counter value={data.totalLeads} />,
      icon: Users,
      color: "#6366f1",
    },
    {
      label: "Valor no funil",
      value: <Counter value={data.pipelineValue} format={formatCurrency} />,
      icon: DollarSign,
      color: "#0ea5e9",
    },
    {
      label: "Negócios ganhos",
      value: <Counter value={data.wonCount} />,
      sub: formatCurrency(data.wonValue),
      icon: Trophy,
      color: "#22c55e",
    },
    {
      label: "Sem site (alvo)",
      value: <Counter value={data.noSiteCount} />,
      icon: Globe2,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card relative overflow-hidden p-5"
            >
              <div
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl"
                style={{ background: k.color }}
              />
              <span
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${k.color}1f`, color: k.color }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-2xl font-bold tracking-tight">{k.value}</p>
              <p className="text-xs text-muted">{k.label}</p>
              {k.sub && <p className="mt-0.5 text-[11px] text-muted">{k.sub}</p>}
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Funil de conversão</h3>
              <p className="text-xs text-muted">
                Taxa de fechamento: {data.conversionRate.toFixed(1)}%
              </p>
            </div>
            <Link
              href="/kanban"
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              Ver funil <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {data.funnel.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-muted">
                  {f.name}
                </span>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.count / maxCount) * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                    className="flex h-full items-center justify-end rounded-lg pr-2"
                    style={{ background: `${f.color}cc`, minWidth: f.count ? "2rem" : 0 }}
                  >
                    <span className="text-xs font-semibold text-white">{f.count}</span>
                  </motion.div>
                </div>
                <span className="w-24 shrink-0 text-right text-xs text-muted">
                  {formatCurrency(f.value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chips summary */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Infra de disparo</h3>
            <Link
              href="/chips"
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              Chips <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={Smartphone} color="#6366f1" label="Chips" value={data.chips.total} />
            <MiniStat icon={Activity} color="#22c55e" label="Ativos" value={data.chips.active} />
            <MiniStat icon={Flame} color="#f59e0b" label="Aquecendo" value={data.chips.warming} />
            <MiniStat icon={Activity} color="#0ea5e9" label="Saúde méd." value={`${data.chips.avgHealth}%`} />
          </div>
          <div className="mt-4 rounded-xl border border-border-soft bg-surface-2/40 p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Uso da capacidade diária</span>
              <span>
                {data.chips.sentToday}/{data.chips.capacity}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    data.chips.capacity
                      ? Math.min(100, (data.chips.sentToday / data.chips.capacity) * 100)
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent leads */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-5"
      >
        <h3 className="mb-4 text-sm font-semibold">Leads recentes</h3>
        <div className="space-y-1">
          {data.recent.map((r) => (
            <Link
              key={r.id}
              href={`/leads/${r.id}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface-2/60"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}99)` }}
              >
                {r.company_name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.company_name}</p>
                <p className="truncate text-xs text-muted">{r.segment || "—"}</p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ color: r.color, background: `${r.color}1f` }}
              >
                {r.stage}
              </span>
              <span className="w-24 text-right text-sm font-semibold">
                {formatCurrency(r.value)}
              </span>
            </Link>
          ))}
          {data.recent.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nenhum lead ainda.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Users;
  color: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-2/40 p-3">
      <Icon className="mb-1.5 h-4 w-4" style={{ color }} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
