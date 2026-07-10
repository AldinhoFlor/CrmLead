"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CsvLead {
  company_name: string;
  segment: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  website_status: string;
  google_maps_url: string | null;
  instagram: string | null;
  facebook: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  priority: string;
  notes: string | null;
  exists?: boolean;
}

function norm(s: string | null | undefined) {
  return (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}
function dedupKey(company_name: string, city: string | null) {
  return norm(company_name) + "|" + norm(city);
}
function digits(s: string | null | undefined) {
  const d = (s ?? "").replace(/\D/g, "");
  return d.length >= 8 ? d : "";
}

interface ExistingSets {
  keys: Set<string>;
  phones: Set<string>;
  maps: Set<string>;
}

async function loadExisting(): Promise<ExistingSets> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("company_name, city, phone, google_maps_url");
  const keys = new Set<string>();
  const phones = new Set<string>();
  const maps = new Set<string>();
  for (const l of data ?? []) {
    keys.add(dedupKey(l.company_name, l.city));
    const d = digits(l.phone);
    if (d) phones.add(d);
    if (l.google_maps_url) maps.add(l.google_maps_url.trim());
  }
  return { keys, phones, maps };
}

/** Flag which rows already exist (in DB or earlier in the same batch). */
export async function markCsvDuplicates(leads: CsvLead[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const existing = await loadExisting();
  const seenKeys = new Set(existing.keys);
  const seenPhones = new Set(existing.phones);
  const seenMaps = new Set(existing.maps);

  const out = leads.map((l) => {
    const key = dedupKey(l.company_name, l.city);
    const d = digits(l.phone);
    const m = l.google_maps_url?.trim() ?? "";
    const dup =
      seenKeys.has(key) || (!!d && seenPhones.has(d)) || (!!m && seenMaps.has(m));
    seenKeys.add(key);
    if (d) seenPhones.add(d);
    if (m) seenMaps.add(m);
    return { ...l, exists: dup };
  });

  return { ok: true, leads: out };
}

const WEBSITE_STATUS = new Set(["sem_site", "desatualizado", "basico", "bom"]);
const PRIORITY = new Set(["alta", "media", "baixa"]);

/** Import the selected CSV rows, skipping duplicates. */
export async function importCsvLeads(leads: CsvLead[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };
  if (!leads.length) return { error: "Nada selecionado." };

  const existing = await loadExisting();
  const seenKeys = new Set(existing.keys);
  const seenPhones = new Set(existing.phones);
  const seenMaps = new Set(existing.maps);

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("id, position, is_won, is_lost")
    .order("position");
  const firstStage = (stages ?? []).find((s) => !s.is_won && !s.is_lost);

  let skipped = 0;
  const rows: Record<string, unknown>[] = [];

  for (const l of leads) {
    if (!l.company_name?.trim()) {
      skipped++;
      continue;
    }
    const key = dedupKey(l.company_name, l.city);
    const d = digits(l.phone);
    const m = l.google_maps_url?.trim() ?? "";
    if (seenKeys.has(key) || (!!d && seenPhones.has(d)) || (!!m && seenMaps.has(m))) {
      skipped++;
      continue;
    }
    seenKeys.add(key);
    if (d) seenPhones.add(d);
    if (m) seenMaps.add(m);

    const socials: Record<string, string> = {};
    if (l.instagram) socials.instagram = l.instagram;
    if (l.facebook) socials.facebook = l.facebook;

    rows.push({
      owner_id: user.id,
      stage_id: firstStage?.id ?? null,
      company_name: l.company_name.trim(),
      segment: l.segment,
      address: l.address,
      city: l.city,
      state: l.state,
      phone: l.phone,
      email: l.email,
      website: l.website,
      website_status: WEBSITE_STATUS.has(l.website_status) ? l.website_status : "sem_site",
      source: "importacao",
      priority: PRIORITY.has(l.priority) ? l.priority : "media",
      google_maps_url: l.google_maps_url,
      google_rating: l.google_rating,
      google_reviews_count: l.google_reviews_count,
      socials,
      notes: l.notes,
      dedup_key: key,
    });
  }

  if (!rows.length) return { ok: true, imported: 0, skipped };

  const { error, count } = await supabase
    .from("leads")
    .insert(rows, { count: "exact" });
  if (error) return { error: error.message };

  revalidatePath("/kanban");
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true, imported: count ?? rows.length, skipped };
}
