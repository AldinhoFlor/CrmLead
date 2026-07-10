"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createChip(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const label = String(formData.get("label") ?? "").trim();
  const phone_number = String(formData.get("phone_number") ?? "").trim();
  if (!label || !phone_number)
    return { error: "Apelido e número são obrigatórios" };

  const { error } = await supabase.from("chips").insert({
    owner_id: user.id,
    label,
    phone_number,
    provider: (formData.get("provider") as string) || null,
    daily_limit: Number(formData.get("daily_limit") ?? 30) || 30,
    warmup_target_days: Number(formData.get("warmup_target_days") ?? 21) || 21,
    rotation_weight: Number(formData.get("rotation_weight") ?? 1) || 1,
    status: "novo",
  });
  if (error) return { error: error.message };
  revalidatePath("/chips");
  return { ok: true };
}

export async function updateChip(id: string, patch: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from("chips").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chips");
  return { ok: true };
}

export async function toggleRotation(id: string, value: boolean) {
  return updateChip(id, { in_rotation: value });
}

export async function deleteChip(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("chips").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chips");
  return { ok: true };
}

/** Advance the warmup ramp one day (calls the SQL function). */
export async function advanceWarmup(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_chip_warmup", {
    p_chip_id: id,
  });
  if (error) return { error: error.message };
  revalidatePath("/chips");
  return { ok: true };
}

/** Reset the sent_today counters for every chip. */
export async function resetDailyCounters() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_daily_chip_counters");
  if (error) return { error: error.message };
  revalidatePath("/chips");
  return { ok: true };
}

/**
 * Randomizer: pick the next chip for a send using the configured strategy.
 * This is the atomic selection (updates counters + logs the pick) that the
 * future Evolution API / n8n integration will call before each dispatch.
 */
export async function pickChip(strategy?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pick_chip", {
    p_strategy: strategy ?? null,
  });
  if (error) return { error: error.message };
  if (!data) return { error: "Nenhum chip elegível (todos no limite ou fora de rotação)" };
  revalidatePath("/chips");
  return { ok: true, chip: data };
}

export async function updateSettings(patch: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("app_settings")
    .upsert({ owner_id: user.id, ...patch, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/chips");
  return { ok: true };
}
