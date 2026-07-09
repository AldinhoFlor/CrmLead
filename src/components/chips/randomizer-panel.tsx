"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Dices, RotateCcw, Shuffle, CheckCircle2 } from "lucide-react";
import type { Chip } from "@/lib/types";
import { pickChip, resetDailyCounters, updateSettings } from "@/app/actions/chips";
import { chipStatusMeta } from "@/lib/utils";

const STRATEGIES = [
  { v: "ponderada", label: "Ponderada", hint: "aleatório por peso + saúde" },
  { v: "round_robin", label: "Round-robin", hint: "o menos usado recentemente" },
  { v: "menos_usado", label: "Menos usado", hint: "menor volume no dia" },
];

export function RandomizerPanel({
  chips,
  strategy,
}: {
  chips: Chip[];
  strategy: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(strategy);
  const [pending, start] = useTransition();
  const [rolling, setRolling] = useState(false);
  const [picked, setPicked] = useState<Chip | null>(null);

  const eligible = chips.filter(
    (c) => c.in_rotation && ["ativo", "aquecendo"].includes(c.status) && c.sent_today < c.daily_limit
  );

  function setStrategy(v: string) {
    setCurrent(v);
    start(async () => {
      await updateSettings({ rotation_strategy: v });
    });
  }

  function draw() {
    if (eligible.length === 0) {
      toast.error("Nenhum chip elegível para rotação agora.");
      return;
    }
    setRolling(true);
    setPicked(null);

    // Visual slot-machine shuffle, then commit the real DB pick.
    let ticks = 0;
    const interval = setInterval(() => {
      setPicked(eligible[Math.floor(Math.random() * eligible.length)]);
      ticks++;
      if (ticks > 12) {
        clearInterval(interval);
        start(async () => {
          const res = await pickChip(current);
          setRolling(false);
          if (res?.error || !res?.chip) {
            toast.error(res?.error ?? "Falha ao sortear");
            setPicked(null);
            return;
          }
          setPicked(res.chip as Chip);
          toast.success(`Chip selecionado: ${(res.chip as Chip).label}`);
          router.refresh();
        });
      }
    }, 70);
  }

  function reset() {
    start(async () => {
      const res = await resetDailyCounters();
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Contadores diários zerados");
        router.refresh();
      }
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border-soft bg-gradient-to-r from-brand/10 to-brand-2/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold">Randomizador de Chip</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          Sorteia o próximo número para disparo respeitando limite diário e saúde.
        </p>
      </div>

      <div className="p-5">
        <div className="mb-4 grid grid-cols-3 gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.v}
              onClick={() => setStrategy(s.v)}
              className={`rounded-xl border p-2.5 text-left transition ${
                current === s.v
                  ? "border-brand/60 bg-brand/10"
                  : "border-border bg-surface-2/40 hover:border-border"
              }`}
            >
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted">{s.hint}</p>
            </button>
          ))}
        </div>

        {/* Result window */}
        <div className="relative mb-4 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-2/40">
          <AnimatePresence mode="popLayout">
            {picked ? (
              <motion.div
                key={picked.id + String(rolling)}
                initial={{ y: 30, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-2">
                  {!rolling && <CheckCircle2 className="h-4 w-4 text-success" />}
                  <span className="text-lg font-bold">{picked.label}</span>
                </div>
                <span className="font-mono text-sm text-muted">
                  {picked.phone_number}
                </span>
                <span
                  className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    color: chipStatusMeta(picked.status).color,
                    background: `${chipStatusMeta(picked.status).color}1f`,
                  }}
                >
                  {chipStatusMeta(picked.status).label}
                </span>
              </motion.div>
            ) : (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted"
              >
                {eligible.length} chip(s) elegível(is) · clique em sortear
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <button
            onClick={draw}
            disabled={pending || rolling}
            className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            <Dices className="h-4 w-4" />
            {rolling ? "Sorteando..." : "Sortear chip"}
          </button>
          <button
            onClick={reset}
            disabled={pending}
            title="Zerar contadores diários"
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm text-muted transition hover:text-fg disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          A seleção é atômica no banco (incrementa envios, registra o evento).
          Na fase 2, a Evolution API / n8n chamam esta mesma função antes de
          cada disparo.
        </p>
      </div>
    </div>
  );
}
