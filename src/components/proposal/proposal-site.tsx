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
} from "lucide-react";
import {
  contentForSegment,
  DIFFERENTIALS,
  type PublicLead,
} from "@/lib/proposal-content";

function waLink(phone: string | null, msg: string) {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.length >= 10 && d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`;
}

export function ProposalSite({ lead }: { lead: PublicLead }) {
  const c = contentForSegment(lead.segment);
  const colors = lead.brand_colors && lead.brand_colors.length >= 2
    ? lead.brand_colors
    : ["#4f46e5", "#7c3aed"];
  const primary = colors[0];
  const secondary = colors[1] ?? colors[0];
  const grad = `linear-gradient(135deg, ${primary}, ${secondary})`;

  const cityLabel = [lead.city, lead.state].filter(Boolean).join(" - ");
  const wa = waLink(lead.phone, `Olá! Vim pelo site da ${lead.company_name} e gostaria de mais informações.`);
  const rating = lead.google_rating;
  const reviews = lead.google_reviews_count ?? 0;
  const ig = lead.socials?.instagram;
  const fb = lead.socials?.facebook;

  const primaryCta = wa
    ? { href: wa, label: c.ctaText, icon: MessageCircle }
    : lead.email
      ? { href: `mailto:${lead.email}`, label: c.ctaText, icon: Mail }
      : null;

  return (
    <div className="relative z-10 min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: grad }}
            >
              {lead.company_name.charAt(0)}
            </span>
            <span className="font-semibold tracking-tight text-slate-900">
              {lead.company_name}
            </span>
          </div>
          {primaryCta && (
            <a
              href={primaryCta.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              style={{ background: grad }}
            >
              <primaryCta.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{primaryCta.label}</span>
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: grad }}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/80">
            {c.kicker}{cityLabel ? ` · ${cityLabel}` : ""}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {c.headline(lead.company_name, lead.city)}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90 md:text-xl">
            {c.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primaryCta && (
              <a
                href={primaryCta.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold shadow-lg transition hover:scale-[1.02]"
                style={{ color: primary }}
              >
                <primaryCta.icon className="h-5 w-5" />
                {primaryCta.label}
              </a>
            )}
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Ver serviços <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {rating != null && (
            <div className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    style={{
                      fill: i < Math.round(rating) ? "#fbbf24" : "transparent",
                      color: "#fbbf24",
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                <b>{rating}</b> no Google{reviews ? ` · ${reviews} avaliações` : ""}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            O que oferecemos
          </h2>
          <p className="mt-2 text-slate-500">
            Tudo o que você precisa, com o cuidado que você merece.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.services.map((s, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: `${primary}15`, color: primary }}
              >
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Differentials */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Por que nos escolher
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIALS.map((d, i) => (
              <div key={i} className="text-center">
                <span
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                  style={{ background: grad }}
                >
                  <d.icon className="h-7 w-7" />
                </span>
                <h3 className="font-semibold text-slate-900">{d.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      {rating != null && (
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="grid items-center gap-10 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:grid-cols-[auto_1fr] md:p-12">
            <div className="text-center md:border-r md:border-slate-100 md:pr-12">
              <div className="text-6xl font-bold" style={{ color: primary }}>
                {rating}
              </div>
              <div className="mt-2 flex justify-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5"
                    style={{
                      fill: i < Math.round(rating) ? "#fbbf24" : "transparent",
                      color: "#fbbf24",
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {reviews ? `${reviews} avaliações` : "avaliação"} no Google
              </p>
            </div>
            <div>
              <Quote className="h-8 w-8" style={{ color: `${primary}66` }} />
              <p className="mt-3 text-xl font-medium leading-relaxed text-slate-700 md:text-2xl">
                Clientes que já conhecem a {lead.company_name} confiam e recomendam.
                Faça parte você também.
              </p>
              {lead.google_maps_url && (
                <a
                  href={lead.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: primary }}
                >
                  Ver avaliações no Google <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Location & contact */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div>
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
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                  style={{ background: grad }}
                >
                  <MapPin className="h-4 w-4" /> Ver no mapa
                </a>
              )}
              {ig && (
                <a
                  href={ig}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              )}
              {fb && (
                <a
                  href={fb}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  <Facebook className="h-4 w-4" /> Facebook
                </a>
              )}
            </div>
          </div>

          {/* Final CTA card */}
          <div
            className="flex flex-col justify-center rounded-3xl p-8 text-white shadow-lg md:p-10"
            style={{ background: grad }}
          >
            <h3 className="text-2xl font-bold md:text-3xl">Vamos conversar?</h3>
            <p className="mt-3 text-white/90">
              Atendimento rápido e sem compromisso. Chame no WhatsApp e tire suas dúvidas agora.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/90">
              {["Resposta rápida", "Atendimento personalizado", "Sem compromisso"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> {t}
                </li>
              ))}
            </ul>
            {primaryCta && (
              <a
                href={primaryCta.href}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold shadow-md transition hover:scale-[1.02]"
                style={{ color: primary }}
              >
                <primaryCta.icon className="h-5 w-5" /> {primaryCta.label}
              </a>
            )}
          </div>
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
              Criamos esta página personalizada para a {lead.company_name}. Gostou?
              {" "}
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
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105"
          style={{ background: "#22c55e" }}
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
