"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  FileUp,
  FileDown,
  Loader2,
  Download,
  CheckCircle2,
  Star,
  Globe,
  GlobeLock,
  AlertTriangle,
} from "lucide-react";
import {
  markCsvDuplicates,
  importCsvLeads,
  type CsvLead,
} from "@/app/actions/import-csv";

const TEMPLATE_HEADERS = [
  "Nome da Empresa",
  "Categoria/Setor",
  "Endereço Completo",
  "Telefone(s)",
  "E-mail",
  "Site Atual",
  "Google Maps Link",
  "Instagram",
  "Facebook",
  "Avaliação (estrelas)",
  "Número de Reviews",
  "Análise da Presença Digital",
  "Score de Oportunidade (1-10)",
  "Ideias para o Site",
  "Oportunidades de Venda",
  "Observações",
];

const TEMPLATE_EXAMPLE = [
  "Churrascaria Fogo Nobre",
  "Restaurante",
  "Av. Brasil, 123, Centro, Toledo - PR",
  "(45) 3333-4444",
  "contato@fogonobre.com.br",
  "SEM SITE",
  "https://maps.google.com/?q=Churrascaria+Fogo+Nobre+Toledo",
  "https://instagram.com/fogonobre",
  "https://facebook.com/fogonobre",
  "4.7",
  "512",
  "Sem site, só Instagram ativo",
  "9",
  "Cardápio online, reservas, delivery",
  "Site novo + Google Ads",
  "Fatura alto, ótimo alvo",
];

// ---- CSV → CsvLead mapping helpers ----
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

function parseCityState(addr: string | null): { city: string | null; state: string | null } {
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

function parseWebsite(raw: string | null): { website: string | null; status: string } {
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

function mapRow(row: Record<string, string>): CsvLead | null {
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

const SITE_LABEL: Record<string, { label: string; color: string }> = {
  sem_site: { label: "Sem site", color: "#ef4444" },
  desatualizado: { label: "Feio/antigo", color: "#f59e0b" },
  basico: { label: "Básico", color: "#0ea5e9" },
  bom: { label: "Bom", color: "#22c55e" },
};

export function CsvImportView() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<CsvLead[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parsing, setParsing] = useState(false);
  const [importing, startImport] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const importable = useMemo(
    () => rows.map((r, i) => ({ r, i })).filter((x) => !x.r.exists),
    [rows]
  );

  function downloadTemplate() {
    const csv = Papa.unparse({ fields: TEMPLATE_HEADERS, data: [TEMPLATE_EXAMPLE] });
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function analyze(text: string) {
    if (!text.trim()) {
      toast.error("Cole um CSV ou selecione um arquivo.");
      return;
    }
    setParsing(true);
    setRows([]);
    setSelected(new Set());
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
    });
    const mapped = (parsed.data || [])
      .map(mapRow)
      .filter((x): x is CsvLead => x !== null);

    if (!mapped.length) {
      setParsing(false);
      toast.error("Nenhuma linha válida encontrada. Confira o cabeçalho do CSV.");
      return;
    }

    const res = await markCsvDuplicates(mapped);
    setParsing(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    const flagged = res.leads ?? mapped;
    setRows(flagged);
    setSelected(new Set(flagged.map((r, i) => (!r.exists ? i : -1)).filter((i) => i >= 0)));
    const novos = flagged.filter((r) => !r.exists).length;
    toast.success(`${flagged.length} linhas · ${novos} novas`);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
      analyze(text);
    };
    reader.readAsText(file, "utf-8");
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === importable.length) setSelected(new Set());
    else setSelected(new Set(importable.map((x) => x.i)));
  }

  function doImport() {
    const chosen = rows.filter((r, i) => selected.has(i) && !r.exists);
    if (!chosen.length) {
      toast.error("Selecione ao menos uma empresa nova.");
      return;
    }
    startImport(async () => {
      const res = await importCsvLeads(chosen);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.imported} lead(s) importado(s)` +
          (res.skipped ? ` · ${res.skipped} duplicados ignorados` : "")
      );
      setRows((prev) => prev.map((r, i) => (selected.has(i) ? { ...r, exists: true } : r)));
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Upload / paste */}
      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Enviar dados</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-fg"
          >
            <FileDown className="h-3.5 w-3.5" /> Baixar modelo CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-brand flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            <FileUp className="h-4 w-4" /> Selecionar arquivo .csv
          </button>
          <span className="self-center text-xs text-muted">ou cole o conteúdo abaixo</span>
        </div>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={4}
          placeholder="Cole aqui o conteúdo do CSV (com cabeçalho)..."
          className="mt-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs outline-none focus:border-brand"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => analyze(raw)}
            disabled={parsing}
            className="flex items-center gap-2 rounded-lg border border-brand/50 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20 disabled:opacity-60"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Analisar CSV
          </button>
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <b className="text-fg">{rows.length}</b> linhas ·{" "}
              <b className="text-fg">{importable.length}</b> novas ·{" "}
              <span className="text-warning">{rows.length - importable.length} duplicadas</span> ·{" "}
              {selected.size} selecionadas
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAll}
                className="rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:text-fg"
              >
                {selected.size === importable.length ? "Limpar" : "Selecionar novas"}
              </button>
              <button
                onClick={doImport}
                disabled={importing || selected.size === 0}
                className="btn-brand flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Importar {selected.size} para o funil
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-3 py-3"></th>
                    <th className="px-3 py-3 font-medium">Empresa</th>
                    <th className="px-3 py-3 font-medium">Local</th>
                    <th className="px-3 py-3 font-medium">Site</th>
                    <th className="px-3 py-3 font-medium">Google</th>
                    <th className="px-3 py-3 font-medium">Prio.</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const site = SITE_LABEL[r.website_status] ?? SITE_LABEL.sem_site;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-border-soft transition ${
                          r.exists ? "opacity-45" : "hover:bg-surface-2/50"
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            disabled={r.exists}
                            checked={selected.has(i)}
                            onChange={() => toggle(i)}
                            className="accent-brand"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{r.company_name}</p>
                          <p className="text-xs text-muted">{r.segment || "—"}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted">
                          {[r.city, r.state].filter(Boolean).join("/") || "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: site.color }}
                          >
                            {r.website ? (
                              <Globe className="h-3.5 w-3.5" />
                            ) : (
                              <GlobeLock className="h-3.5 w-3.5" />
                            )}
                            {site.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {r.google_rating != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                              {r.google_rating}
                              <span className="text-muted">({r.google_reviews_count ?? 0})</span>
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs capitalize text-muted">{r.priority}</td>
                        <td className="px-3 py-2.5">
                          {r.exists ? (
                            <span className="inline-flex items-center gap-1 text-xs text-warning">
                              <AlertTriangle className="h-3.5 w-3.5" /> duplicada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" /> nova
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Duplicadas são detectadas por <b>nome + cidade</b>, <b>telefone</b> ou{" "}
            <b>link do Google Maps</b> — comparando com o que já existe na base e dentro do próprio
            arquivo. Toda a análise (score, ideias, oportunidades) vai para as observações do lead.
          </p>
        </div>
      )}
    </div>
  );
}
