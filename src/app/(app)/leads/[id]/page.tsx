import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadDetail } from "@/components/lead-detail";
import type { Activity, Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const [{ data: stages }, { data: activities }] = await Promise.all([
    supabase.from("pipeline_stages").select("*").order("position"),
    supabase
      .from("activities")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <LeadDetail
      lead={lead as Lead}
      stages={(stages ?? []) as PipelineStage[]}
      activities={(activities ?? []) as Activity[]}
    />
  );
}
