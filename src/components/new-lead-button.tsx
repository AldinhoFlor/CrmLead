"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { PipelineStage } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { LeadForm } from "@/components/lead-form";

export function NewLeadButton({
  stages,
  defaultStageId,
  variant = "solid",
  label = "Novo Lead",
}: {
  stages: PipelineStage[];
  defaultStageId?: string;
  variant?: "solid" | "ghost";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "solid" ? (
        <button
          onClick={() => setOpen(true)}
          className="btn-brand flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          {label}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted transition hover:border-brand/50 hover:text-brand"
        >
          <Plus className="h-3.5 w-3.5" />
          {label}
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo Lead" wide>
        <LeadForm stages={stages} defaultStageId={defaultStageId} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
