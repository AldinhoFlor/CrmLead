import Papa from "papaparse";

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

/** Shape accepted by the ingest_leads RPC / webhook. */
export interface IngestLead {
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
  google_rating: number | null;
  google_reviews_count: number | null;
  socials: Record<string, string>;
  priority: string;
  notes: string | null;
}

function pick(m: Record<string, string>, cands: string[]): string | null {
  for (const c of cands) {
    const v = m[c.toLowerCase()];
    if (v && v.trim()) return v.trim();
  }
  for (const [h, v] of Object.entries(m)) {
    if (v && v.trim() && cands.some((c) => h.includes(c.toLowerCase())))
      return v.trim();
  }
  return null;
}

export function parseCityState(addr: string | null): {
  city: string | null;
  state: string | null;
} {
  if (!addr) return { city: null, state: null };
  const m = addr.match(/,\s*([^,]+?)\s*[-–]\s*([A-Za-z]{2})\b/);
  if (m) return { city: m[1].trim(), state: m[2].toUpperCase() };
  return { city: null, state: null };
}

function firstPhone(p: string | null): string | null {
  if (!p || /n[aã]o dispon/i.test(p)) return null;
  const first = p.split("/")[0].trim();
  return first || null;
}

export function parseWebsite(raw: string | null): {
  website: string | null;
  status: string;
} {
  if (!raw || /sem site/i.test(raw)) return { website: null, status: "sem_site" };
  const dm = raw.match(/((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+)/i);
  if (!dm) return { website: null, status: "sem_site" };
  let url = dm[1];
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const broken = /404|erro|inoperante|fora do ar/i.test(raw);
  const weak = /gratuita|spotway|b[aá]sico|sem agendamento|n[aã]o profissional/i.test(raw);
  return { website: url, status: broken || weak ? "desatualizado" : "basico" };
}

function parseRating(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  return v >= 0 && v <= 5 ? v : null;
}
function parseIntSafe(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}
function socialUrl(s: string | null): string | null {
  if (!s || /n[aã]o|nenhum/i.test(s)) return null;
  return s.trim();
}

/** Map one CSV row (flexible headers) into a CsvLead. */
export function mapRow(row: Record<string, string>): CsvLead | null {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) m[k.trim().toLowerCase()] = v ?? "";

  const company_name = pick(m, ["Nome da Empresa", "Empresa", "Nome"]);
  if (!company_name) return null;

  const address = pick(m, ["Endereço Completo", "Endereço", "Endereco"]);
  const { city, state } = parseCityState(address);
  const { website, status } = parseWebsite(pick(m, ["Site Atual", "Site", "Website"]));

  const score = parseIntSafe(pick(m, ["Score de Oportunidade", "Score", "Oportunidade"]));
  const rating = parseRating(pick(m, ["Avaliação (estrelas)", "Avaliação", "Avaliacao", "Nota"]));
  const reviews = parseIntSafe(pick(m, ["Número de Reviews", "Numero de Reviews", "Reviews"]));

  const analysis = pick(m, ["Análise da Presença Digital", "Analise", "Presença Digital"]);
  const ideas = pick(m, ["Ideias para o Site", "Ideias"]);
  const sales = pick(m, ["Oportunidades de Venda", "Oportunidades"]);
  const obs = pick(m, ["Observações", "Observacoes", "Obs"]);

  const noteParts: string[] = [];
  if (score != null) noteParts.push(`Score de oportunidade: ${score}/10`);
  if (analysis) noteParts.push(`Presença digital: ${analysis}`);
  if (ideas) noteParts.push(`Ideias para o site: ${ideas}`);
  if (sales) noteParts.push(`Oportunidades de venda: ${sales}`);
  if (obs) noteParts.push(`Observações: ${obs}`);

  const priority = score != null ? (score >= 8 ? "alta" : score >= 5 ? "media" : "baixa") : "media";

  return {
    company_name,
    segment: pick(m, ["Categoria/Setor", "Categoria", "Setor", "Segmento"]),
    address,
    city,
    state,
    phone: firstPhone(pick(m, ["Telefone(s)", "Telefone", "Fone", "WhatsApp"])),
    email: pick(m, ["E-mail", "Email"]),
    website,
    website_status: status,
    google_maps_url: pick(m, ["Google Maps Link", "Google Maps", "Maps"]),
    instagram: socialUrl(pick(m, ["Instagram", "Insta"])),
    facebook: socialUrl(pick(m, ["Facebook", "Face"])),
    google_rating: rating,
    google_reviews_count: reviews,
    priority,
    notes: noteParts.join("\n\n") || null,
  };
}

/** Parse raw CSV text into CsvLead[]. */
export function mapCsvText(text: string): CsvLead[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  return (parsed.data || [])
    .map(mapRow)
    .filter((x): x is CsvLead => x !== null);
}

/** Convert a CsvLead into the RPC/webhook shape (socials object). */
export function toIngestLead(l: CsvLead): IngestLead {
  const socials: Record<string, string> = {};
  if (l.instagram) socials.instagram = l.instagram;
  if (l.facebook) socials.facebook = l.facebook;
  return {
    company_name: l.company_name,
    segment: l.segment,
    address: l.address,
    city: l.city,
    state: l.state,
    phone: l.phone,
    email: l.email,
    website: l.website,
    website_status: l.website_status,
    google_maps_url: l.google_maps_url,
    google_rating: l.google_rating,
    google_reviews_count: l.google_reviews_count,
    socials,
    priority: l.priority,
    notes: l.notes,
  };
}

/** Normalize an arbitrary JSON lead object into the RPC/webhook shape. */
export function normalizeJsonLead(o: Record<string, unknown>): IngestLead | null {
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const company_name = s(o.company_name) ?? s(o.empresa) ?? s(o.nome) ?? s(o.name);
  if (!company_name) return null;

  const socials: Record<string, string> = {};
  const soc = (o.socials ?? {}) as Record<string, unknown>;
  const ig = s(soc.instagram) ?? s(o.instagram);
  const fb = s(soc.facebook) ?? s(o.facebook);
  const li = s(soc.linkedin) ?? s(o.linkedin);
  if (ig) socials.instagram = ig;
  if (fb) socials.facebook = fb;
  if (li) socials.linkedin = li;

  const num = (v: unknown) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const m = v.match(/\d+(?:[.,]\d+)?/);
      return m ? parseFloat(m[0].replace(",", ".")) : null;
    }
    return null;
  };

  return {
    company_name,
    segment: s(o.segment) ?? s(o.categoria) ?? s(o.setor),
    address: s(o.address) ?? s(o.endereco) ?? s(o["endereço"]),
    city: s(o.city) ?? s(o.cidade),
    state: s(o.state) ?? s(o.uf) ?? s(o.estado),
    phone: s(o.phone) ?? s(o.telefone) ?? s(o.whatsapp),
    email: s(o.email) ?? s(o["e-mail"]),
    website: s(o.website) ?? s(o.site),
    website_status: s(o.website_status) ?? "sem_site",
    google_maps_url: s(o.google_maps_url) ?? s(o.maps) ?? s(o.google_maps),
    google_rating: num(o.google_rating ?? o.rating ?? o.nota),
    google_reviews_count: num(o.google_reviews_count ?? o.reviews),
    socials,
    priority: s(o.priority) ?? s(o.prioridade) ?? "media",
    notes: s(o.notes) ?? s(o.observacoes) ?? s(o["observações"]),
  };
}
