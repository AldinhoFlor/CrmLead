"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import type { Lead, PipelineStage } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { NewLeadButton } from "@/components/new-lead-button";
import { formatCurrency } from "@/lib/utils";

export function KanbanColumn({
  stage,
  leads,
  stages,
  followupDays,
  discardDays,
}: {
  stage: PipelineStage;
  leads: Lead[];
  stages: PipelineStage[];
  followupDays: number;
  discardDays: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: "column", stageId: stage.id },
  });

  const total = leads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: stage.color }}
          />
          <h3 className="text-sm font-semibold">{stage.name}</h3>
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
            {leads.length}
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted">
          {formatCurrency(total)}
        </span>
      </div>

      <motion.div
        ref={setNodeRef}
        animate={{
          backgroundColor: isOver ? "rgba(99,102,241,0.06)" : "rgba(0,0,0,0)",
        }}
        className="flex min-h-[120px] flex-1 flex-col gap-2 rounded-2xl border border-border-soft/60 p-2 transition-colors"
        style={{
          borderColor: isOver ? "rgba(99,102,241,0.4)" : undefined,
        }}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              followupDays={followupDays}
              discardDays={discardDays}
            />
          ))}
        </SortableContext>

        <div className="mt-1">
          <NewLeadButton
            stages={stages}
            defaultStageId={stage.id}
            variant="ghost"
            label="Adicionar"
          />
        </div>
      </motion.div>
    </div>
  );
}
