"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Star,
  Globe,
  GlobeLock,
  Download,
  MapPin,
  Phone,
  CheckCircle2,
} from "lucide-react";
import {
  startProspect,
  checkProspect,
  importProspects,
  type ProspectResult,
} from "@/app/actions/prospect";

const field =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25";
const labelCls = "mb-1 block text-xs font-medium text-muted";

type Phase = "idle" | "running" | "done";

export function ProspectView() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(40);
  const [minReviews, setMinReviews] = useState(0);
  const [onlyNoSite, setOnlyNoSite] = useState(true);

  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<ProspectResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, startImport] = useTransition();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (onlyNoSite && r.hasWebsite) return false;
      if (minReviews && (r.reviews ?? 0) < minReviews) return false;
      return true;
    });
  }, [results, onlyNoSite, minReviews]);

  const importable = filtered.filter((r) => !r.exists);

  function stopPolling() {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  }

  async function run() {
    if (!niche.trim() || !location.trim()) {
      toast.error("Informe nicho e cidade.");
      return;
    }
    setPhase("running");
    setResults([]);
    setSelected(new Set());

    const started = await startProspect({ niche, location, maxResults });
    if (started?.error || !started?.runId) {
      toast.error(started?.error ?? "Falha ao iniciar a busca.");
      setPhase("idle");
      return;
    }

    const { runId, datasetId } = started;
    let ticks = 0;

    const poll = async () => {
      ticks++;
      const res = await checkProspect(runId, datasetId);
      if (res?.error && res.status !== "RUNNING") {
        toast.error(res.error);
        setPhase("idle");
        return;
      }
      if (res?.status === "SUCCEEDED" && res.results) {
        const found = res.results;
        setResults(found);
        // Pre-select importable ones respecting current filters.
        setSelected(
          new Set(
            found
              .filter((r) => !r.exists && (!onlyNoSite || !r.hasWebsite))
              .map((r) => r.placeId)
          )
        );
        setPhase("done");
        toast.success(`${found.length} empresas encontradas`);
        return;
      }
      if (ticks > 90) {
        toast.error("A busca demorou demais. Tente uma quantidade menor.");
        setPhase("idle");
        return;
      }
      pollRef.current = setTimeout(poll, 4000);
    };

    pollRef.current = setTimeout(poll, 4000);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === importable.length) setSelected(new Set());
    else setSelected(new Set(importable.map((r) => r.placeId)));
  }

  function doImport() {
    const chosen = filtered.filter((r) => selected.has(r.placeId) && !r.exists);
    if (!chosen.length) {
      toast.error("Selecione ao menos uma empresa nova.");
      return;
    }
    startImport(async () => {
      const res = await importProspects(chosen);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.imported} lead(s) importado(s)` +
          (res.skipped ? ` · ${res.skipped} já existiam` : "")
      );
      // Mark imported as existing so they can't be re-imported.
      setResults((prev) =>
        prev.map((r) =>
          selected.has(r.placeId) ? { ...r, exists: true } : r
        )
      );
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="card p-5">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_auto]">
          <div>
            <label className={labelCls}>Nicho / segmento</label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="churrascaria, clínica odontológica..."
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Cidade / região</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="São Paulo, SP"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Qtd. máx.</label>
            <input
              type="number"
              value={maxResults}
              min={1}
              max={120}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Mín. avaliações</label>
            <input
              type="number"
              value={minReviews}
              min={0}
              onChange={(e) => setMinReviews(Number(e.target.value))}
              className={field}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={run}
              disabled={phase === "running"}
              className="btn-brand flex h-[38px] items-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
            >
              {phase === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {phase === "running" ? "Buscando" : "Buscar"}
            </button>
          </div>
        </div>
        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={onlyNoSite}
            onChange={(e) => setOnlyNoSite(e.target.checked)}
            className="accent-brand"
          />
          Mostrar apenas empresas <b className="text-fg">sem site</b> (alvos quentes)
        </label>
      </div>

      {/* Running state */}
      <AnimatePresence>
        {phase === "running" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card flex items-center gap-3 p-5 text-sm text-muted"
          >
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
            Raspando o Google Maps via Apify — isso leva de 30s a alguns minutos
            dependendo da quantidade. Pode aguardar aqui.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {phase === "done" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <b className="text-fg">{filtered.length}</b> empresas
              {onlyNoSite ? " sem site" : ""} ·{" "}
              <b className="text-fg">{importable.length}</b> novas ·{" "}
              {selected.size} selecionadas
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAll}
                className="rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:text-fg"
              >
                {selected.size === importable.length
                  ? "Limpar seleção"
                  : "Selecionar todas"}
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
                    <th className="px-3 py-3 font-medium">Site</th>
                    <th className="px-3 py-3 font-medium">Google</th>
                    <th className="px-3 py-3 font-medium">Local</th>
                    <th className="px-3 py-3 font-medium">Contato</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.placeId}
                      className={`border-b border-border-soft transition ${
                        r.exists ? "opacity-45" : "hover:bg-surface-2/50"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          disabled={r.exists}
                          checked={selected.has(r.placeId)}
                          onChange={() => toggle(r.placeId)}
                          className="accent-brand"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{r.companyName}</p>
                        <p className="text-xs text-muted">{r.segment || "—"}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        {r.hasWebsite ? (
                          <span className="inline-flex items-center gap-1 text-xs text-warning">
                            <Globe className="h-3.5 w-3.5" /> tem site
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
                            <GlobeLock className="h-3.5 w-3.5" /> sem site
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.rating != null ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                            {r.rating}
                            <span className="text-muted">
                              ({r.reviews ?? 0})
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[r.city, r.state].filter(Boolean).join("/") || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted">
                        {r.exists ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> na base
                          </span>
                        ) : r.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {r.phone}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-10 text-center text-sm text-muted"
                      >
                        Nenhum resultado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
