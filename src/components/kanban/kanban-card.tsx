"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { Star, Globe, Phone, GripVertical } from "lucide-react";
import type { Lead } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  formatCurrency,
  priorityMeta,
  websiteMeta,
} from "@/lib/utils";

export function KanbanCard({ lead, overlay }: { lead: Lead; overlay?: boolean }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { type: "lead", lead } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const prio = priorityMeta(lead.priority);
  const site = websiteMeta(lead.website_status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group card cursor-pointer p-3 transition-shadow hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5",
        isDragging && "opacity-40",
        overlay && "rotate-2 border-brand/60 shadow-2xl shadow-brand/20"
      )}
      onClick={() => !isDragging && router.push(`/leads/${lead.id}`)}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{lead.company_name}</p>
          {lead.segment && (
            <p className="truncate text-xs text-muted">{lead.segment}</p>
          )}
        </div>
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="-mr-1 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5">
        <Badge label={site.label} color={site.color} />
        <Badge label={prio.label} color={prio.color} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-semibold text-fg">
          {formatCurrency(lead.estimated_value)}
        </span>
        <div className="flex items-center gap-2.5">
          {lead.google_rating != null && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {lead.google_rating}
            </span>
          )}
          {lead.website ? (
            <Globe className="h-3.5 w-3.5 text-success" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-danger/70" />
          )}
          {lead.phone && <Phone className="h-3.5 w-3.5" />}
        </div>
      </div>
    </div>
  );
}
