"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plug, Flame, Shuffle } from "lucide-react";
import type { AppSettings } from "@/lib/types";
import { updateSettings } from "@/app/actions/chips";

const field =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25";
const labelCls = "mb-1 block text-xs font-medium text-muted";

export function SettingsForm({ settings }: { settings: Partial<AppSettings> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    warmup_min_per_day: settings.warmup_min_per_day ?? 5,
    warmup_max_per_day: settings.warmup_max_per_day ?? 60,
    rotation_strategy: settings.rotation_strategy ?? "ponderada",
    evolution_base_url: settings.evolution_base_url ?? "",
    n8n_webhook_url: settings.n8n_webhook_url ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function save() {
    start(async () => {
      const res = await updateSettings({
        warmup_min_per_day: Number(form.warmup_min_per_day),
        warmup_max_per_day: Number(form.warmup_max_per_day),
        rotation_strategy: form.rotation_strategy,
        evolution_base_url: form.evolution_base_url || null,
        n8n_webhook_url: form.n8n_webhook_url || null,
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Configurações salvas");
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold">Aquecimento</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Mínimo de mensagens/dia</label>
            <input
              type="number"
              value={form.warmup_min_per_day}
              onChange={(e) => set("warmup_min_per_day", Number(e.target.value))}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Máximo de mensagens/dia</label>
            <input
              type="number"
              value={form.warmup_max_per_day}
              onChange={(e) => set("warmup_max_per_day", Number(e.target.value))}
              className={field}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold">Rotação de chips</h3>
        </div>
        <label className={labelCls}>Estratégia padrão do randomizador</label>
        <select
          value={form.rotation_strategy}
          onChange={(e) => set("rotation_strategy", e.target.value)}
          className={field}
        >
          <option value="ponderada">Ponderada (peso + saúde)</option>
          <option value="round_robin">Round-robin (menos usado recentemente)</option>
          <option value="menos_usado">Menos usado no dia</option>
        </select>
      </div>

      <div className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <Plug className="h-4 w-4 text-info" />
          <h3 className="text-sm font-semibold">Integrações (disparo)</h3>
        </div>
        <p className="mb-4 text-xs text-muted">
          Endpoints usados na fase de disparo real. Salvos com segurança;
          nenhuma credencial é exposta no front-end.
        </p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Evolution API — Base URL</label>
            <input
              value={form.evolution_base_url}
              onChange={(e) => set("evolution_base_url", e.target.value)}
              placeholder="https://evolution.seudominio.com"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>n8n — Webhook URL</label>
            <input
              value={form.n8n_webhook_url}
              onChange={(e) => set("n8n_webhook_url", e.target.value)}
              placeholder="https://n8n.seudominio.com/webhook/..."
              className={field}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={pending}
          className="btn-brand flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configurações
        </button>
      </div>
    </div>
  );
}
