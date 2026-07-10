"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PipelineStage } from "@/lib/types";
import { createLead } from "@/app/actions/leads";

const field =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25";
const labelCls = "mb-1 block text-xs font-medium text-muted";

export function LeadForm({
  stages,
  defaultStageId,
  onDone,
}: {
  stages: PipelineStage[];
  defaultStageId?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    start(async () => {
      const res = await createLead(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      toast.success("Lead criado com sucesso");
      router.refresh();
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Empresa *</label>
          <input name="company_name" required className={field} placeholder="Ex: Churrascaria Fogo Nobre" />
        </div>
        <div>
          <label className={labelCls}>Contato</label>
          <input name="contact_name" className={field} placeholder="Nome do responsável" />
        </div>
        <div>
          <label className={labelCls}>WhatsApp / Telefone</label>
          <input name="phone" className={field} placeholder="+55 11 9..." />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input name="email" type="email" className={field} placeholder="contato@empresa.com" />
        </div>
        <div>
          <label className={labelCls}>Segmento</label>
          <input name="segment" className={field} placeholder="Restaurante, Clínica..." />
        </div>
        <div>
          <label className={labelCls}>Cidade</label>
          <input name="city" className={field} placeholder="São Paulo" />
        </div>
        <div>
          <label className={labelCls}>UF</label>
          <input name="state" className={field} placeholder="SP" maxLength={2} />
        </div>
        <div>
          <label className={labelCls}>Situação do site</label>
          <select name="website_status" className={field} defaultValue="sem_site">
            <option value="sem_site">Sem site</option>
            <option value="desatualizado">Site feio/antigo</option>
            <option value="basico">Site básico</option>
            <option value="bom">Site bom</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Prioridade</label>
          <select name="priority" className={field} defaultValue="media">
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Origem</label>
          <select name="source" className={field} defaultValue="google">
            <option value="google">Google</option>
            <option value="manual">Manual</option>
            <option value="indicacao">Indicação</option>
            <option value="instagram">Instagram</option>
            <option value="importacao">Importação</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Faturamento estimado</label>
          <input name="monthly_revenue" className={field} placeholder="R$ 150k/mês" />
        </div>
        <div>
          <label className={labelCls}>Valor do negócio (R$)</label>
          <input name="estimated_value" type="number" step="100" className={field} placeholder="3500" />
        </div>
        <div>
          <label className={labelCls}>Estágio</label>
          <select name="stage_id" className={field} defaultValue={defaultStageId ?? stages[0]?.id}>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Observações</label>
          <textarea name="notes" rows={2} className={field} placeholder="Anotações sobre o lead..." />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:bg-surface-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn-brand flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar lead
        </button>
      </div>
    </form>
  );
}
