import { createClient } from "@/lib/supabase/server";
import { Smartphone, Flame, Activity, ShieldCheck } from "lucide-react";
import { ChipCard } from "@/components/chips/chip-card";
import { RandomizerPanel } from "@/components/chips/randomizer-panel";
import { AddChipButton } from "@/components/chips/add-chip-button";
import type { AppSettings, Chip } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChipsPage() {
  const supabase = await createClient();
  const [{ data: chips }, { data: settings }] = await Promise.all([
    supabase.from("chips").select("*").order("created_at", { ascending: true }),
    supabase.from("app_settings").select("*").single(),
  ]);

  const chipList = (chips ?? []) as Chip[];
  const cfg = (settings ?? { rotation_strategy: "ponderada" }) as Partial<AppSettings>;

  const total = chipList.length;
  const active = chipList.filter((c) => c.status === "ativo").length;
  const warming = chipList.filter((c) => c.status === "aquecendo").length;
  const avgHealth =
    total > 0
      ? Math.round(chipList.reduce((s, c) => s + c.health_score, 0) / total)
      : 0;
  const sentToday = chipList.reduce((s, c) => s + c.sent_today, 0);
  const capacity = chipList
    .filter((c) => c.in_rotation)
    .reduce((s, c) => s + c.daily_limit, 0);

  const stats = [
    { label: "Chips cadastrados", value: total, icon: Smartphone, color: "#6366f1" },
    { label: "Ativos", value: active, icon: ShieldCheck, color: "#22c55e" },
    { label: "Em aquecimento", value: warming, icon: Flame, color: "#f59e0b" },
    { label: "Saúde média", value: `${avgHealth}%`, icon: Activity, color: "#0ea5e9" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Chips & Aquecedor</h2>
          <p className="text-sm text-muted">
            Gestão de números, aquecimento gradual e rotação inteligente
          </p>
        </div>
        <AddChipButton />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${s.color}1f`, color: s.color }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted">
              Números ({total})
            </h3>
            <span className="text-xs text-muted">
              Enviados hoje: <b className="text-fg">{sentToday}</b> / capacidade {capacity}
            </span>
          </div>
          {total === 0 ? (
            <div className="card p-10 text-center text-sm text-muted">
              Nenhum chip cadastrado. Clique em “Novo Chip” para começar.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {chipList.map((chip) => (
                <ChipCard key={chip.id} chip={chip} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <RandomizerPanel
            chips={chipList}
            strategy={cfg.rotation_strategy ?? "ponderada"}
          />

          <div className="card p-5">
            <div className="mb-2 flex items-center gap-2">
              <Flame className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold">Como o aquecedor funciona</h3>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-muted">
              <li>• Cada “Aquecer” avança 1 dia do ramp e sobe o limite diário gradualmente (+5), até o número virar “ativo”.</li>
              <li>• A saúde sobe com o aquecimento e cai se o número for sinalizado.</li>
              <li>• O randomizador só sorteia chips <b>em rotação</b>, ativos/aquecendo e abaixo do limite diário.</li>
              <li>• Disparo automático via Evolution API/n8n pluga aqui na próxima fase.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
