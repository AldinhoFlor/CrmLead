"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Lead, PipelineStage } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { moveLead } from "@/app/actions/leads";

type ColumnsMap = Record<string, Lead[]>;

function buildColumns(stages: PipelineStage[], leads: Lead[]): ColumnsMap {
  const map: ColumnsMap = {};
  for (const s of stages) map[s.id] = [];
  const fallback = stages[0]?.id;
  for (const lead of leads) {
    const key = lead.stage_id && map[lead.stage_id] ? lead.stage_id : fallback;
    if (key) map[key].push(lead);
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.position - b.position);
  }
  return map;
}

export function KanbanBoard({
  stages,
  leads,
}: {
  stages: PipelineStage[];
  leads: Lead[];
}) {
  const [columns, setColumns] = useState<ColumnsMap>(() =>
    buildColumns(stages, leads)
  );
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const leadIndex = useMemo(() => {
    const idx = new Map<string, string>(); // leadId -> stageId
    for (const [stageId, list] of Object.entries(columns)) {
      for (const l of list) idx.set(l.id, stageId);
    }
    return idx;
  }, [columns]);

  function findStageOf(id: string): string | undefined {
    if (columns[id]) return id; // dropped on a column directly
    return leadIndex.get(id);
  }

  function onDragStart(e: DragStartEvent) {
    const lead = e.active.data.current?.lead as Lead | undefined;
    if (lead) setActiveLead(lead);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const from = findStageOf(activeId);
    const to = findStageOf(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromList = [...prev[from]];
      const toList = [...prev[to]];
      const movingIndex = fromList.findIndex((l) => l.id === activeId);
      if (movingIndex < 0) return prev;
      const [moving] = fromList.splice(movingIndex, 1);

      const overIndex = toList.findIndex((l) => l.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toList.length;
      toList.splice(insertAt, 0, { ...moving, stage_id: to });

      return { ...prev, [from]: fromList, [to]: toList };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveLead(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const stageId = findStageOf(overId);
    if (!stageId) return;

    setColumns((prev) => {
      const list = [...prev[stageId]];
      const oldIndex = list.findIndex((l) => l.id === activeId);
      const overIndex = list.findIndex((l) => l.id === overId);
      let next = list;
      if (oldIndex >= 0 && overIndex >= 0 && oldIndex !== overIndex) {
        next = arrayMove(list, oldIndex, overIndex);
      }
      const finalPos = next.findIndex((l) => l.id === activeId);
      // Persist async (fire and forget); optimistic UI already updated.
      moveLead(activeId, stageId, finalPos < 0 ? next.length : finalPos);
      return { ...prev, [stageId]: next };
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={columns[stage.id] ?? []}
            stages={stages}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {activeLead ? (
          <div className="w-72">
            <KanbanCard lead={activeLead} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
