"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { createChip } from "@/app/actions/chips";

const field =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25";
const labelCls = "mb-1 block text-xs font-medium text-muted";

export function AddChipButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const res = await createChip(formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Chip cadastrado");
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-brand flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
      >
        <Plus className="h-4 w-4" />
        Novo Chip
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar Chip">
        <form action={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Apelido *</label>
              <input name="label" required className={field} placeholder="Chip Vendas 03" />
            </div>
            <div>
              <label className={labelCls}>Número *</label>
              <input name="phone_number" required className={field} placeholder="+55 11 9..." />
            </div>
            <div>
              <label className={labelCls}>Operadora</label>
              <select name="provider" className={field} defaultValue="Vivo">
                <option>Vivo</option>
                <option>Claro</option>
                <option>TIM</option>
                <option>Outra</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Limite diário inicial</label>
              <input name="daily_limit" type="number" defaultValue={15} className={field} />
            </div>
            <div>
              <label className={labelCls}>Dias de aquecimento</label>
              <input name="warmup_target_days" type="number" defaultValue={21} className={field} />
            </div>
            <div>
              <label className={labelCls}>Peso na rotação</label>
              <input name="rotation_weight" type="number" defaultValue={1} min={1} className={field} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn-brand flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
