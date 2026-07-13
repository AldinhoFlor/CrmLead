"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Building2,
  DollarSign,
  MessageSquarePlus,
  StickyNote,
  PhoneCall,
  Send,
  Users,
  Trash2,
  Palette,
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Music2,
  Twitter,
  Link2,
  Clock,
  ExternalLink,
  Copy,
  Globe2,
  Sparkles,
  Loader2,
  X,
  Archive,
} from "lucide-react";
import type { Activity, Lead, PipelineStage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  formatCurrency,
  formatDate,
  priorityMeta,
  websiteMeta,
  timeAgo,
  proposalStatus,
} from "@/lib/utils";
import {
  updateLead,
  addActivity,
  deleteLead,
  setProposalSent,
  archiveLead,
} from "@/app/actions/leads";
import {
  generateProposalCopy,
  generateProposalEmail,
  type ProposalEmail,
} from "@/app/actions/ai-proposal";

const ACTIVITY_META: Record<string, { icon: typeof StickyNote; color: string; label: string }> = {
  nota: { icon: StickyNote, color: "#6366f1", label: "Nota" },
  ligacao: { icon: PhoneCall, color: "#0ea5e9", label: "Ligação" },
  whatsapp: { icon: MessageSquarePlus, color: "#22c55e", label: "WhatsApp" },
  email: { icon: Mail, color: "#f59e0b", label: "E-mail" },
  reuniao: { icon: Users, color: "#a855f7", label: "Reunião" },
  proposta_enviada: { icon: Send, color: "#ec4899", label: "Proposta enviada" },
  mudanca_estagio: { icon: ArrowLeft, color: "#8b8ba7", label: "Estágio" },
  mudanca_status: { icon: ArrowLeft, color: "#8b8ba7", label: "Status" },
};

export function LeadDetail({
  lead,
  stages,
  activities,
  followupDays = 5,
  discardDays = 14,
}: {
  lead: Lead;
  stages: PipelineStage[];
  activities: Activity[];
  followupDays?: number;
  discardDays?: number;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [aiPending, startAi] = useTransition();
  const [emailPending, startEmail] = useTransition();
  const [email, setEmail] = useState<ProposalEmail | null>(null);
  const site = websiteMeta(lead.website_status);
  const prio = priorityMeta(lead.priority);

  function patch(field: string, value: unknown) {
    start(async () => {
      const res = await updateLead(lead.id, { [field]: value });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Atualizado");
        router.refresh();
      }
    });
  }

  function remove() {
    if (!confirm(`Excluir o lead "${lead.company_name}"?`)) return;
    start(async () => {
      await deleteLead(lead.id);
      toast.success("Lead excluído");
      router.push("/leads");
    });
  }

  function genAi() {
    startAi(async () => {
      const res = await generateProposalCopy(lead.id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Textos personalizados gerados com IA!");
        router.refresh();
      }
    });
  }

  const prop = proposalStatus(lead, followupDays, discardDays);
  const sent = !!lead.proposal_sent_at;

  function toggleSent() {
    start(async () => {
      const res = await setProposalSent(lead.id, !sent);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(sent ? "Marcada como não enviada" : "Proposta marcada como enviada");
        router.refresh();
      }
    });
  }

  function discard() {
    if (!confirm(`Descartar (arquivar) o lead "${lead.company_name}"? Ele sai do funil.`))
      return;
    start(async () => {
      await archiveLead(lead.id);
      toast.success("Lead descartado (arquivado)");
      router.push("/leads");
    });
  }

  function genEmail() {
    const url = `${window.location.origin}/proposta/${lead.id}`;
    startEmail(async () => {
      const res = await generateProposalEmail(lead.id, url);
      if (res?.error) toast.error(res.error);
      else if (res?.ok) {
        setEmail(res.email);
        toast.success("E-mail de proposta gerado!");
      }
    });
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copiado!`),
      () => toast.error("Não foi possível copiar")
    );
  }

  function copyProposal() {
    const url = `${window.location.origin}/proposta/${lead.id}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link do site copiado!"),
      () => toast.error("Não foi possível copiar o link")
    );
  }

  const waLink = lead.phone
    ? `https://wa.me/${lead.phone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${
                  lead.brand_colors?.[0] ?? "#6366f1"
                }, ${lead.brand_colors?.[1] ?? "#8b5cf6"})`,
              }}
            >
              {lead.company_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {lead.company_name}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge label={site.label} color={site.color} />
                <Badge label={prio.label} color={prio.color} />
                {lead.segment && (
                  <span className="text-xs text-muted">{lead.segment}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={lead.stage_id ?? ""}
              onChange={(e) => patch("stage_id", e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={lead.priority ?? "media"}
              onChange={(e) => patch("priority", e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
            <button
              onClick={remove}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:border-danger/40 hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Proposal / generated site */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="card flex flex-col gap-3 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white">
            <Globe2 className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Site de proposta</p>
            <p className="text-xs text-muted">
              {lead.ai_content
                ? "Textos personalizados por IA ✨"
                : "Página de vendas personalizada para enviar ao lead"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={genAi}
            disabled={aiPending}
            title="Gerar textos únicos com IA para este lead"
            className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand transition hover:bg-brand/20 disabled:opacity-60"
          >
            {aiPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {lead.ai_content ? "Regerar com IA" : "Gerar textos com IA"}
          </button>
          <button
            onClick={genEmail}
            disabled={emailPending}
            title="Gerar o e-mail de proposta para enviar ao dono do negócio"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-fg disabled:opacity-60"
          >
            {emailPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            Gerar e-mail
          </button>
          <button
            onClick={copyProposal}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-fg"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar link
          </button>
          <a
            href={`/proposta/${lead.id}`}
            target="_blank"
            rel="noreferrer"
            className="btn-brand flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir site
          </a>
        </div>
        </div>

        {/* Proposal tracking: sent state + follow-up timing */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3">
          <div className="flex items-center gap-2">
            {prop.state !== "none" && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
                style={{ color: prop.color, background: `${prop.color}1f` }}
              >
                {prop.state === "ready" ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {prop.label}
              </span>
            )}
            {sent && lead.proposal_sent_at && (
              <span className="text-xs text-muted">
                em {formatDate(lead.proposal_sent_at)}
              </span>
            )}
            {prop.state === "followup" && (
              <span className="text-xs text-warning">— hora de cobrar</span>
            )}
            {prop.state === "discard" && (
              <span className="text-xs text-danger">— sem resposta, considere descartar</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSent}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                sent
                  ? "border-border text-muted hover:text-fg"
                  : "border-success/40 bg-success/10 text-success hover:bg-success/20"
              )}
            >
              <Send className="h-3.5 w-3.5" />
              {sent ? "Desmarcar envio" : "Marcar proposta enviada"}
            </button>
            <button
              onClick={discard}
              title="Arquivar o lead (sai do funil)"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-danger/40 hover:text-danger"
            >
              <Archive className="h-3.5 w-3.5" /> Descartar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Generated proposal e-mail */}
      {email && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold">E-mail de proposta</h3>
            </div>
            <button
              onClick={() => setEmail(null)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:text-fg"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Assunto
                </span>
                <button
                  onClick={() => copyText(email.subject, "Assunto")}
                  className="flex items-center gap-1 text-[11px] text-muted transition hover:text-fg"
                >
                  <Copy className="h-3 w-3" /> Copiar
                </button>
              </div>
              <input
                readOnly
                value={email.subject}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Mensagem
                </span>
                <button
                  onClick={() => copyText(email.body, "E-mail")}
                  className="flex items-center gap-1 text-[11px] text-muted transition hover:text-fg"
                >
                  <Copy className="h-3 w-3" /> Copiar
                </button>
              </div>
              <textarea
                readOnly
                value={email.body}
                rows={10}
                className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm leading-relaxed outline-none"
              />
            </div>
            <p className="text-[11px] text-muted">
              Revise, ajuste o que quiser e cole no seu e-mail. Anexar um print
              do topo da nova página aumenta o clique.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: details */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card divide-y divide-border-soft"
          >
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold">Informações</h3>
            </div>
            <InfoRow icon={Building2} label="Segmento" value={lead.segment} />
            <InfoRow icon={Phone} label="Telefone" value={lead.phone}
              action={waLink ? { href: waLink, label: "WhatsApp" } : undefined} />
            <InfoRow icon={Mail} label="E-mail" value={lead.email} />
            <InfoRow icon={Globe} label="Site atual" value={lead.website}
              action={lead.website ? { href: lead.website, label: "Abrir" } : undefined} />
            <InfoRow
              icon={MapPin}
              label="Localização"
              value={[lead.city, lead.state].filter(Boolean).join(" / ") || null}
            />
            <InfoRow icon={DollarSign} label="Faturamento" value={lead.monthly_revenue} />
            <InfoRow
              icon={DollarSign}
              label="Valor do negócio"
              value={formatCurrency(lead.estimated_value)}
            />
            {lead.google_rating != null && (
              <div className="flex items-center gap-3 px-5 py-3">
                <Star className="h-4 w-4 shrink-0 text-warning" />
                <span className="text-xs text-muted">Google</span>
                <span className="ml-auto flex items-center gap-1 text-sm font-medium">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {lead.google_rating} · {lead.google_reviews_count ?? 0} avaliações
                </span>
              </div>
            )}
          </motion.div>

          {/* Brand kit — for future site generation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold">Acessar a empresa & redes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {lead.google_maps_url && (
                <LinkChip icon={MapPin} label="Google Maps" href={lead.google_maps_url} color="#22c55e" />
              )}
              {lead.website && (
                <LinkChip icon={Globe} label="Site" href={lead.website} color="#0ea5e9" />
              )}
              {waLink && (
                <LinkChip icon={MessageCircle} label="WhatsApp" href={waLink} color="#22c55e" />
              )}
              {lead.email && (
                <LinkChip icon={Mail} label="E-mail" href={`mailto:${lead.email}`} color="#f59e0b" />
              )}
              {lead.socials?.instagram && (
                <LinkChip icon={Instagram} label="Instagram" href={lead.socials.instagram} color="#ec4899" />
              )}
              {lead.socials?.facebook && (
                <LinkChip icon={Facebook} label="Facebook" href={lead.socials.facebook} color="#3b82f6" />
              )}
              {lead.socials?.linkedin && (
                <LinkChip icon={Linkedin} label="LinkedIn" href={lead.socials.linkedin} color="#0ea5e9" />
              )}
              {lead.socials?.youtube && (
                <LinkChip icon={Youtube} label="YouTube" href={lead.socials.youtube} color="#ef4444" />
              )}
              {lead.socials?.tiktok && (
                <LinkChip icon={Music2} label="TikTok" href={lead.socials.tiktok} color="#a855f7" />
              )}
              {lead.socials?.twitter && (
                <LinkChip icon={Twitter} label="X / Twitter" href={lead.socials.twitter} color="#64748b" />
              )}
            </div>
            {!lead.google_maps_url &&
              !lead.website &&
              !waLink &&
              !lead.email &&
              !lead.socials?.instagram &&
              !lead.socials?.facebook && (
                <p className="text-xs text-muted">
                  Nenhum link encontrado para este lead ainda.
                </p>
              )}
            {(lead.opening_hours || lead.price_level) && (
              <div className="mt-3 space-y-1 border-t border-border-soft pt-3 text-xs text-muted">
                {lead.opening_hours && (
                  <p className="flex items-start gap-1.5">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {lead.opening_hours}
                  </p>
                )}
                {lead.price_level && (
                  <p>
                    Faixa de preço: <b className="text-fg">{lead.price_level}</b>
                  </p>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold">Identidade da marca</h3>
              <span className="ml-auto text-[11px] text-muted">para a proposta/site</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(lead.brand_colors?.length ? lead.brand_colors : ["#6366f1", "#8b5cf6"]).map(
                (c, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-1">
                    <span className="h-4 w-4 rounded" style={{ background: c }} />
                    <span className="font-mono text-xs text-muted">{c}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-5"
          >
            <h3 className="mb-3 text-sm font-semibold">Observações</h3>
            <NotesEditor
              initial={lead.notes ?? ""}
              onSave={(v) => patch("notes", v)}
            />
          </motion.div>
        </div>

        {/* Right: activity timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card flex flex-col p-5"
        >
          <h3 className="mb-4 text-sm font-semibold">Atividades & Histórico</h3>
          <ActivityComposer leadId={lead.id} />
          <div className="mt-5 space-y-4">
            {activities.length === 0 && (
              <p className="text-sm text-muted">Nenhuma atividade ainda.</p>
            )}
            {activities.map((a) => {
              const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.nota;
              const Icon = meta.icon;
              return (
                <div key={a.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: `${meta.color}1f`, color: meta.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="mt-1 w-px flex-1 bg-border-soft" />
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-muted">
                        {timeAgo(a.created_at)} · {formatDate(a.created_at)}
                      </span>
                    </div>
                    {a.content && (
                      <p className="mt-0.5 text-sm text-fg/90">{a.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LinkChip({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: typeof Phone;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:brightness-110"
      style={{ color, background: `${color}14`, borderColor: `${color}33` }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Icon className="h-4 w-4 shrink-0 text-muted" />
      <span className="text-xs text-muted">{label}</span>
      <span className="ml-auto flex items-center gap-2 truncate text-sm">
        <span className="truncate">{value || "—"}</span>
        {action && (
          <a
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md bg-brand/15 px-2 py-0.5 text-[11px] font-medium text-brand transition hover:bg-brand/25"
          >
            {action.label}
          </a>
        )}
      </span>
    </div>
  );
}

function NotesEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder="Anotações internas sobre o lead..."
        className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {dirty && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => onSave(value)}
            className="btn-brand rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityComposer({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [type, setType] = useState("nota");
  const [content, setContent] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!content.trim()) return;
    start(async () => {
      const res = await addActivity(leadId, type, content.trim());
      if (res?.error) toast.error(res.error);
      else {
        setContent("");
        toast.success("Atividade registrada");
        router.refresh();
      }
    });
  }

  const types = [
    { v: "nota", label: "Nota" },
    { v: "ligacao", label: "Ligação" },
    { v: "whatsapp", label: "WhatsApp" },
    { v: "email", label: "E-mail" },
    { v: "reuniao", label: "Reunião" },
    { v: "proposta_enviada", label: "Proposta" },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface-2/50 p-3">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {types.map((t) => (
          <button
            key={t.v}
            onClick={() => setType(t.v)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              type === t.v
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Registrar atividade..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={submit}
          disabled={pending || !content.trim()}
          className="btn-brand flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
