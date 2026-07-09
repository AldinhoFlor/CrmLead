"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const company_name = String(formData.get("company_name") ?? "").trim();
  if (!company_name) return { error: "Nome da empresa é obrigatório" };

  const stage_id = (formData.get("stage_id") as string) || null;
  const estimated_value = Number(formData.get("estimated_value") ?? 0) || 0;

  const { error } = await supabase.from("leads").insert({
    owner_id: user.id,
    company_name,
    contact_name: (formData.get("contact_name") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    website: (formData.get("website") as string) || null,
    website_status: (formData.get("website_status") as string) || "sem_site",
    segment: (formData.get("segment") as string) || null,
    city: (formData.get("city") as string) || null,
    state: (formData.get("state") as string) || null,
    source: (formData.get("source") as string) || "manual",
    priority: (formData.get("priority") as string) || "media",
    monthly_revenue: (formData.get("monthly_revenue") as string) || null,
    estimated_value,
    stage_id,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/kanban");
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

export async function updateLead(id: string, patch: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kanban");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true };
}

export async function moveLead(id: string, stage_id: string, position: number) {
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("stage_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({ stage_id, position })
    .eq("id", id);
  if (error) return { error: error.message };

  if (lead && lead.stage_id !== stage_id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: stage } = await supabase
      .from("pipeline_stages")
      .select("name")
      .eq("id", stage_id)
      .single();
    await supabase.from("activities").insert({
      owner_id: user?.id,
      lead_id: id,
      type: "mudanca_estagio",
      content: `Movido para "${stage?.name ?? "novo estágio"}"`,
    });
  }

  revalidatePath("/kanban");
  return { ok: true };
}

export async function archiveLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ is_archived: true })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kanban");
  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kanban");
  revalidatePath("/leads");
  return { ok: true };
}

export async function addActivity(
  lead_id: string,
  type: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("activities").insert({
    owner_id: user.id,
    lead_id,
    type,
    content,
  });
  if (error) return { error: error.message };

  await supabase
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", lead_id);

  revalidatePath(`/leads/${lead_id}`);
  return { ok: true };
}
