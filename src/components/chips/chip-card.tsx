"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Flame,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import type { Chip } from "@/lib/types";
import {
  chipStatusMeta,
  healthColor,
  timeAgo,
} from "@/lib/utils";
import {
  advanceWarmup,
  deleteChip,
  toggleRotation,
} from "@/app/actions/chips";

export function ChipCard({ chip }: { chip: Chip }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const status = chipStatusMeta(chip.status);
  const warmPct = Math.min(
    100,
    Math.round((chip.warmup_day / Math.max(chip.warmup_target_days, 1)) * 100)
  );
  const usagePct = Math.min(
    100,
    Math.round((chip.sent_today / Math.max(chip.daily_limit, 1)) * 100)
  );

  function run(fn: () => Promise<{ error?: string } | void>, ok: string) {
    start(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card relative overflow-hidden p-4"
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: status.color }}
      />
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{chip.label}</p>
            {chip.is_connected ? (
              <Wifi className="h-3.5 w-3.5 text-success" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-muted" />
            )}
          </div>
          <p className="font-mono text-xs text-muted">{chip.phone_number}</p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            color: status.color,
            background: `${status.color}1f`,
            border: `1px solid ${status.color}33`,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Health */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>Saúde do número</span>
          <span className="font-semibold" style={{ color: healthColor(chip.health_score) }}>
            {chip.health_score}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${chip.health_score}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: healthColor(chip.health_score) }}
          />
        </div>
      </div>

      {/* Warmup ramp */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-warning" /> Aquecimento
          </span>
          <span>
            dia {chip.warmup_day}/{chip.warmup_target_days}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${warmPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-warning to-danger"
          />
        </div>
      </div>

      {/* Daily usage */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>Envios hoje</span>
          <span>
            {chip.sent_today}/{chip.daily_limit}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-[11px] text-muted">
        <span>Peso: {chip.rotation_weight}× · Total: {chip.total_sent}</span>
        <span>{timeAgo(chip.last_used_at)}</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-2.5 py-1.5 text-xs">
          <input
            type="checkbox"
            checked={chip.in_rotation}
            disabled={pending}
            onChange={(e) =>
              run(() => toggleRotation(chip.id, e.target.checked), "Rotação atualizada")
            }
            className="accent-brand"
          />
          Em rotação
        </label>
        <button
          disabled={pending || chip.warmup_day >= chip.warmup_target_days}
          onClick={() => run(() => advanceWarmup(chip.id), "Aquecimento avançado")}
          title="Avançar 1 dia de aquecimento"
          className="flex items-center gap-1 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs font-medium text-warning transition hover:bg-warning/20 disabled:opacity-40"
        >
          <Zap className="h-3.5 w-3.5" /> Aquecer
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Excluir o chip "${chip.label}"?`))
              run(() => deleteChip(chip.id), "Chip excluído");
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-danger/40 hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
