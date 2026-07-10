"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const APIFY_ACTOR = "compass~crawler-google-places";
const APIFY_BASE = "https://api.apify.com/v2";

export interface ProspectResult {
  placeId: string;
  companyName: string;
  phone: string | null;
  website: string | null;
  hasWebsite: boolean;
  segment: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  mapsUrl: string | null;
  imageUrl: string | null;
  email: string | null;
  exists?: boolean;
}

function token() {
  return process.env.APIFY_TOKEN;
}

/** Kick off a Google Maps scrape run on Apify. Returns run + dataset ids. */
export async function startProspect(input: {
  niche: string;
  location: string;
  maxResults: number;
}) {
  const t = token();
  if (!t) return { error: "APIFY_TOKEN não configurado no ambiente." };
  if (!input.niche.trim() || !input.location.trim())
    return { error: "Informe nicho e cidade." };

  const body = {
    searchStringsArray: [input.niche.trim()],
    locationQuery: `${input.location.trim()}, Brazil`,
    maxCrawledPlacesPerSearch: Math.min(Math.max(input.maxResults, 1), 120),
    language: "pt-BR",
    skipClosedPlaces: true,
    scrapeContacts: false,
  };

  const res = await fetch(
    `${APIFY_BASE}/acts/${APIFY_ACTOR}/runs?token=${t}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const msg = await res.text();
    return { error: `Falha ao iniciar Apify (${res.status}): ${msg.slice(0, 200)}` };
  }

  const json = await res.json();
  return {
    ok: true,
    runId: json.data?.id as string,
    datasetId: json.data?.defaultDatasetId as string,
  };
}

/** Poll a run; when finished, return the mapped + dedup-flagged results. */
export async function checkProspect(runId: string, datasetId: string) {
  const t = token();
  if (!t) return { error: "APIFY_TOKEN não configurado." };

  const runRes = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}?token=${t}`,
    { cache: "no-store" }
  );
  if (!runRes.ok) return { error: `Falha ao consultar run (${runRes.status}).` };
  const runJson = await runRes.json();
  const status = runJson.data?.status as string;

  if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
    return { status, error: "A busca falhou no Apify. Tente novamente." };
  }
  if (status !== "SUCCEEDED") {
    return { status }; // RUNNING / READY — client keeps polling
  }

  const dsRes = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${t}&clean=true&format=json`,
    { cache: "no-store" }
  );
  if (!dsRes.ok) return { error: `Falha ao ler resultados (${dsRes.status}).` };
  const items = (await dsRes.json()) as Record<string, unknown>[];

  const results: ProspectResult[] = items
    .map(mapItem)
    .filter((r): r is ProspectResult => r !== null);

  // Flag places already in the base (dedup preview)
  const supabase = await createClient();
  const ids = results.map((r) => r.placeId).filter(Boolean);
  if (ids.length) {
    const { data: existing } = await supabase
      .from("leads")
      .select("google_place_id")
      .in("google_place_id", ids);
    const set = new Set((existing ?? []).map((e) => e.google_place_id));
    for (const r of results) r.exists = set.has(r.placeId);
  }

  return { status, results };
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

function mapItem(it: Record<string, unknown>): ProspectResult | null {
  const companyName = str(it.title) ?? str(it.name);
  const placeId = str(it.placeId) ?? str(it.place_id);
  if (!companyName || !placeId) return null;

  const website = str(it.website) ?? str(it.website);
  const emails = Array.isArray(it.emails) ? (it.emails as string[]) : [];

  return {
    placeId,
    companyName,
    phone: str(it.phone) ?? str(it.phoneUnformatted),
    website,
    hasWebsite: !!website,
    segment: str(it.categoryName) ?? str(it.category),
    city: str(it.city),
    state: str(it.state),
    address: str(it.address) ?? str(it.street),
    rating: num(it.totalScore) ?? num(it.rating),
    reviews: num(it.reviewsCount) ?? num(it.reviews),
    mapsUrl: str(it.url) ?? str(it.googleMapsUrl),
    imageUrl: str(it.imageUrl),
    email: emails[0] ? str(emails[0]) : null,
  };
}

function classify(r: ProspectResult): {
  website_status: string;
  priority: string;
} {
  const website_status = r.hasWebsite ? "basico" : "sem_site";
  const reviews = r.reviews ?? 0;
  const rating = r.rating ?? 0;
  let priority = "baixa";
  if (reviews >= 150 && rating >= 4.3) priority = "alta";
  else if (reviews >= 50) priority = "media";
  if (!r.hasWebsite && reviews >= 80) priority = "alta"; // hot: fatura bem, sem site
  return { website_status, priority };
}

/** Import selected results into the pipeline (dedup by google_place_id). */
export async function importProspects(results: ProspectResult[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  if (!results.length) return { error: "Nada selecionado." };

  // Default stage = first (lowest position) that isn't won/lost.
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("id, position, is_won, is_lost")
    .order("position");
  const firstStage = (stages ?? []).find((s) => !s.is_won && !s.is_lost);

  // Skip places already in the base.
  const ids = results.map((r) => r.placeId);
  const { data: existing } = await supabase
    .from("leads")
    .select("google_place_id")
    .in("google_place_id", ids);
  const known = new Set((existing ?? []).map((e) => e.google_place_id));

  const rows = results
    .filter((r) => !known.has(r.placeId))
    .map((r) => {
      const { website_status, priority } = classify(r);
      return {
        owner_id: user.id,
        stage_id: firstStage?.id ?? null,
        company_name: r.companyName,
        phone: r.phone,
        email: r.email,
        website: r.website,
        website_status,
        segment: r.segment,
        city: r.city,
        state: r.state,
        address: r.address,
        source: "google",
        priority,
        google_place_id: r.placeId,
        google_rating: r.rating,
        google_reviews_count: r.reviews,
        google_maps_url: r.mapsUrl,
        logo_url: r.imageUrl,
      };
    });

  if (!rows.length) return { ok: true, imported: 0, skipped: results.length };

  const { error, count } = await supabase
    .from("leads")
    .insert(rows, { count: "exact" });
  if (error) return { error: error.message };

  revalidatePath("/kanban");
  revalidatePath("/leads");
  revalidatePath("/");
  return {
    ok: true,
    imported: count ?? rows.length,
    skipped: results.length - rows.length,
  };
}
