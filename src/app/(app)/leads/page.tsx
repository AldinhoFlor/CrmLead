import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/leads-table";
import { NewLeadButton } from "@/components/new-lead-button";
import type { Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const [{ data: stages }, { data: leads }] = await Promise.all([
    supabase.from("pipeline_stages").select("*").order("position"),
    supabase
      .from("leads")
      .select("*")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Todos os Leads</h2>
          <p className="text-sm text-muted">
            Base completa de empresas prospectadas
          </p>
        </div>
        <NewLeadButton stages={(stages ?? []) as PipelineStage[]} />
      </div>

      <LeadsTable
        leads={(leads ?? []) as Lead[]}
        stages={(stages ?? []) as PipelineStage[]}
      />
    </div>
  );
}
