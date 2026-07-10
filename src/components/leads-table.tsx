"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Star } from "lucide-react";
import type { Lead, PipelineStage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  priorityMeta,
  websiteMeta,
  timeAgo,
} from "@/lib/utils";

export function LeadsTable({
  leads,
  stages,
}: {
  leads: Lead[];
  stages: PipelineStage[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");

  const stageName = useMemo(() => {
    const m = new Map<string, PipelineStage>();
    for (const s of stages) m.set(s.id, s);
    return m;
  }, [stages]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return leads.filter((l) => {
      if (
        term &&
        !`${l.company_name} ${l.contact_name ?? ""} ${l.segment ?? ""} ${l.city ?? ""}`
          .toLowerCase()
          .includes(term)
      )
        return false;
      if (stageFilter && l.stage_id !== stageFilter) return false;
      if (siteFilter && l.website_status !== siteFilter) return false;
      return true;
    });
  }, [leads, q, stageFilter, siteFilter]);

  const inputCls =
    "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por empresa, contato, cidade..."
            className={`${inputCls} w-full pl-9`}
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">Todos os estágios</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">Situação do site</option>
          <option value="sem_site">Sem site</option>
          <option value="desatualizado">Site feio/antigo</option>
          <option value="basico">Site básico</option>
          <option value="bom">Site bom</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Estágio</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Prioridade</th>
                <th className="px-4 py-3 font-medium">Google</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const stage = l.stage_id ? stageName.get(l.stage_id) : null;
                const prio = priorityMeta(l.priority);
                const site = websiteMeta(l.website_status);
                return (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => router.push(`/leads/${l.id}`)}
                    className="cursor-pointer border-b border-border-soft transition hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{l.company_name}</p>
                      <p className="text-xs text-muted">
                        {[l.segment, l.city].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {stage ? (
                        <Badge label={stage.name} color={stage.color} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={site.label} color={site.color} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={prio.label} color={prio.color} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {l.google_rating != null ? (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          {l.google_rating}
                          <span className="text-xs">
                            ({l.google_reviews_count ?? 0})
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(l.estimated_value)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {timeAgo(l.updated_at)}
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    Nenhum lead encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted">
        {filtered.length} de {leads.length} leads
      </p>
    </div>
  );
}
