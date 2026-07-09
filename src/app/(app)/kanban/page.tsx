import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { NewLeadButton } from "@/components/new-lead-button";
import type { Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const supabase = await createClient();

  const [{ data: stages }, { data: leads }] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("*")
      .order("position", { ascending: true }),
    supabase
      .from("leads")
      .select("*")
      .eq("is_archived", false)
      .order("position", { ascending: true }),
  ]);

  const stageList = (stages ?? []) as PipelineStage[];
  const leadList = (leads ?? []) as Lead[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Funil de Vendas</h2>
          <p className="text-sm text-muted">
            Arraste os cards entre os estágios · {leadList.length} leads ativos
          </p>
        </div>
        <NewLeadButton stages={stageList} />
      </div>

      <KanbanBoard stages={stageList} leads={leadList} />
    </div>
  );
}
