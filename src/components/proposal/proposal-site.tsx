"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Clock,
  ArrowRight,
  Check,
  Quote,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  contentForSegment,
  DIFFERENTIALS,
  type PublicLead,
} from "@/lib/proposal-content";
import { imagesForSegment } from "@/lib/proposal-images";

function waLink(phone: string | null, msg: string) {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.length >= 10 && d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`;
}

/** Image that gracefully falls back to a brand gradient if it fails to load. */
function SmartImg({
  src,
  grad,
  className,
  imgClassName,
}: {
  src: string;
  grad: string;
  className?: string;
  imgClassName?: string;
}) {
  const [ok, setOk] = useState(true);
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: grad }}>
      {ok && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setOk(false)}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      )}
    </div>
  );
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ProposalSite({ lead }: { lead: PublicLead }) {
  const c = contentForSegment(lead.segment);
  const imgs = imagesForSegment(lead.segment);
  const colors =
    lead.brand_colors && lead.brand_colors.length >= 2
      ? lead.brand_colors
      : ["#4f46e5", "#7c3aed"];
  const primary = colors[0];
  const secondary = colors[1] ?? colors[0];
  const grad = `linear-gradient(135deg, ${primary}, ${secondary})`;

  const cityLabel = [lead.city, lead.state].filter(Boolean).join(" - ");
  const wa = waLink(
    lead.phone,
    `Olá! Vim pelo site da ${lead.company_name} e gostaria de mais informações.`
  );
  const rating = lead.google_rating;
  const reviews = lead.google_reviews_count ?? 0;
  const ig = lead.socials?.instagram;
  const fb = lead.socials?.facebook;

  const cta = wa
    ? { href: wa, label: c.ctaText, icon: MessageCircle }
    : lead.email
      ? { href: `mailto:${lead.email}`, label: c.ctaText, icon: Mail }
      : null;

  const stats: { value: string; label: string }[] = [];
  if (rating != null) stats.push({ value: `${rating}★`, label: "Nota no Google" });
  if (reviews) stats.push({ value: `${reviews}+`, label: "Avaliações" });
  if (cityLabel) stats.push({ value: lead.city ?? "", label: "Atendimento local" });
  stats.push({ value: "24/7", label: "Contato no WhatsApp" });

  return (
    <div className="relative z-10 min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow"
              style={{ background: grad }}
            >
              {lead.company_name.charAt(0)}
            </span>
            <span className="font-semibold tracking-tight text-white drop-shadow">
              {lead.company_name}
            </span>
          </div>
          {cta && (
            <a
              href={cta.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              style={{ background: grad }}
            >
              <cta.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{cta.label}</span>
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <SmartImg src={imgs[0]} grad={grad} className="absolute inset-0" imgClassName="scale-105" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(6,8,15,0.92), rgba(6,8,15,0.45) 55%, rgba(6,8,15,0.5)), linear-gradient(120deg, ${primary}66, transparent 60%)`,
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 pt-24">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl">
            <motion.p
              variants={reveal}
              className="mb-4 inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur"
            >
              {c.kicker}
              {cityLabel ? ` · ${cityLabel}` : ""}
            </motion.p>
            <motion.h1
              variants={reveal}
              className="text-4xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-lg md:text-6xl"
            >
              {c.headline(lead.company_name, lead.city)}
            </motion.h1>
            <motion.p variants={reveal} className="mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
              {c.subheadline}
            </motion.p>
            <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center gap-3">
              {cta && (
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold shadow-2xl transition hover:scale-[1.03]"
                  style={{ color: primary }}
                >
                  <cta.icon className="h-5 w-5" />
                  {cta.label}
                </a>
              )}
              <a
                href="#servicos"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Ver serviços <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
            {rating != null && (
              <motion.div
                variants={reveal}
                className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur"
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4"
                      style={{ fill: i < Math.round(rating) ? "#fbbf24" : "transparent", color: "#fbbf24" }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-white">
                  <b>{rating}</b> no Google{reviews ? ` · ${reviews} avaliações` : ""}
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* Stats card (overlaps hero) */}
      <div className="mx-auto -mt-14 max-w-5xl px-5">
        <Reveal>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 shadow-xl md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white p-6 text-center">
                <div className="text-2xl font-bold text-slate-900 md:text-3xl" style={{ color: primary }}>
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Services */}
      <section id="servicos" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <Reveal className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: primary }}>
            Nossos serviços
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Tudo o que você precisa
          </h2>
        </Reveal>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-70px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {c.services.map((s, i) => (
            <motion.div
              key={i}
              variants={reveal}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-110"
                style={{ background: `${primary}15`, color: primary }}
              >
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Gallery */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: primary }}>
              Galeria
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Um pouco do nosso mundo
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
            {imgs.slice(0, 5).map((src, i) => (
              <Reveal
                key={i}
                delay={i * 0.05}
                className={cn(
                  "group overflow-hidden rounded-2xl",
                  i === 0 && "md:col-span-2 md:row-span-2"
                )}
              >
                <SmartImg
                  src={src}
                  grad={grad}
                  className={cn("h-40 w-full md:h-full", i === 0 && "min-h-[13rem] md:min-h-full")}
                  imgClassName="transition duration-500 group-hover:scale-110"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* About / differentials */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <SmartImg
              src={imgs[1] ?? imgs[0]}
              grad={grad}
              className="aspect-[4/3] w-full rounded-3xl shadow-xl"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: primary }}>
              Por que nos escolher
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Experiência que gera confiança
            </h2>
            <p className="mt-3 text-slate-500">
              Cada detalhe pensado para você ter a melhor experiência, do primeiro
              contato ao resultado final.
            </p>
            <div className="mt-7 space-y-4">
              {DIFFERENTIALS.map((d, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: grad }}
                  >
                    <d.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{d.title}</p>
                    <p className="text-sm text-slate-500">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Social proof */}
      {rating != null && (
        <section className="py-8">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <div
                className="grid items-center gap-10 rounded-3xl p-8 text-white shadow-xl md:grid-cols-[auto_1fr] md:p-12"
                style={{ background: grad }}
              >
                <div className="text-center md:border-r md:border-white/20 md:pr-12">
                  <div className="text-6xl font-bold">{rating}</div>
                  <div className="mt-2 flex justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5"
                        style={{ fill: i < Math.round(rating) ? "#fbbf24" : "transparent", color: "#fbbf24" }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-white/80">
                    {reviews ? `${reviews} avaliações` : "avaliação"} no Google
                  </p>
                </div>
                <div>
                  <Quote className="h-9 w-9 text-white/60" />
                  <p className="mt-3 text-xl font-medium leading-relaxed md:text-2xl">
                    Quem conhece a {lead.company_name} confia e recomenda. Venha viver
                    essa experiência você também.
                  </p>
                  {lead.google_maps_url && (
                    <a
                      href={lead.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white underline-offset-4 hover:underline"
                    >
                      Ver avaliações no Google <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Location + final CTA */}
      <section className="py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Onde nos encontrar
            </h2>
            <div className="mt-6 space-y-4 text-slate-600">
              {lead.address && (
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primary }} />
                  {lead.address}
                </p>
              )}
              {lead.phone && (
                <p className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0" style={{ color: primary }} />
                  {lead.phone}
                </p>
              )}
              {lead.opening_hours && (
                <p className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primary }} />
                  {lead.opening_hours}
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {lead.google_maps_url && (
                <a
                  href={lead.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow"
                  style={{ background: grad }}
                >
                  <MapPin className="h-4 w-4" /> Ver no mapa
                </a>
              )}
              {ig && (
                <a href={ig} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              )}
              {fb && (
                <a href={fb} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Facebook className="h-4 w-4" /> Facebook
                </a>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl md:p-10">
              <SmartImg src={imgs[2] ?? imgs[0]} grad={grad} className="absolute inset-0" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}f2, ${secondary}e6)` }} />
              <div className="relative">
                <h3 className="text-2xl font-bold md:text-3xl">Vamos conversar?</h3>
                <p className="mt-3 text-white/90">
                  Atendimento rápido e sem compromisso. Chame no WhatsApp e tire suas
                  dúvidas agora mesmo.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-white/90">
                  {["Resposta rápida", "Atendimento personalizado", "Sem compromisso"].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <Check className="h-4 w-4" /> {t}
                    </li>
                  ))}
                </ul>
                {cta && (
                  <a
                    href={cta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold shadow-lg transition hover:scale-[1.03]"
                    style={{ color: primary }}
                  >
                    <cta.icon className="h-5 w-5" /> {cta.label}
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer + proposal note */}
      <footer className="bg-slate-900 py-10 text-slate-300">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-lg font-semibold text-white">{lead.company_name}</p>
              {cityLabel && <p className="text-sm text-slate-400">{cityLabel}</p>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {lead.phone && <span className="text-slate-400">{lead.phone}</span>}
              {lead.email && <span className="text-slate-400">{lead.email}</span>}
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
            <p className="font-medium text-white">✨ Esta é uma prévia do seu novo site.</p>
            <p className="mt-1 text-slate-400">
              Criamos esta página personalizada para a {lead.company_name}. Gostou?{" "}
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className="font-semibold text-white underline">
                  Fale com a gente para colocar no ar.
                </a>
              ) : (
                <span className="font-semibold text-white">Fale com a gente para colocar no ar.</span>
              )}
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      {wa && (
        <motion.a
          href={wa}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl"
          style={{ background: "#22c55e" }}
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-green-500/40" />
          <MessageCircle className="relative h-7 w-7" />
        </motion.a>
      )}
    </div>
  );
}
