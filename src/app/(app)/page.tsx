import { createClient } from "@/lib/supabase/server";
import { DashboardView, type DashboardData } from "@/components/dashboard/dashboard-view";
import type { Chip, Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: stages }, { data: leads }, { data: chips }] = await Promise.all([
    supabase.from("pipeline_stages").select("*").order("position"),
    supabase.from("leads").select("*").eq("is_archived", false),
    supabase.from("chips").select("*"),
  ]);

  const stageList = (stages ?? []) as PipelineStage[];
  const leadList = (leads ?? []) as Lead[];
  const chipList = (chips ?? []) as Chip[];

  const stageMap = new Map(stageList.map((s) => [s.id, s]));
  const wonStage = stageList.find((s) => s.is_won);
  const lostStage = stageList.find((s) => s.is_lost);

  const wonLeads = leadList.filter((l) => l.stage_id === wonStage?.id);
  const openLeads = leadList.filter(
    (l) => l.stage_id !== wonStage?.id && l.stage_id !== lostStage?.id
  );

  const funnel = stageList.map((s) => {
    const inStage = leadList.filter((l) => l.stage_id === s.id);
    return {
      name: s.name,
      count: inStage.length,
      value: inStage.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0),
      color: s.color,
    };
  });

  const closedTotal = wonLeads.length + leadList.filter((l) => l.stage_id === lostStage?.id).length;
  const conversionRate = closedTotal > 0 ? (wonLeads.length / closedTotal) * 100 : 0;

  const recent = [...leadList]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 6)
    .map((l) => {
      const stage = l.stage_id ? stageMap.get(l.stage_id) : undefined;
      return {
        id: l.id,
        company_name: l.company_name,
        segment: l.segment,
        value: l.estimated_value ?? 0,
        stage: stage?.name ?? "—",
        color: stage?.color ?? "#6366f1",
      };
    });

  const data: DashboardData = {
    totalLeads: leadList.length,
    pipelineValue: openLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0),
    wonCount: wonLeads.length,
    wonValue: wonLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0),
    noSiteCount: leadList.filter((l) => l.website_status === "sem_site").length,
    conversionRate,
    funnel,
    recent,
    chips: {
      total: chipList.length,
      active: chipList.filter((c) => c.status === "ativo").length,
      warming: chipList.filter((c) => c.status === "aquecendo").length,
      avgHealth:
        chipList.length > 0
          ? Math.round(chipList.reduce((s, c) => s + c.health_score, 0) / chipList.length)
          : 0,
      sentToday: chipList.reduce((s, c) => s + c.sent_today, 0),
      capacity: chipList.filter((c) => c.in_rotation).reduce((s, c) => s + c.daily_limit, 0),
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Visão geral</h2>
        <p className="text-sm text-muted">
          Seu funil de captação e a infraestrutura de disparo num só lugar
        </p>
      </div>
      <DashboardView data={data} />
    </div>
  );
}
