import type { LucideIcon } from "lucide-react";
import {
  Smile,
  Stethoscope,
  Sparkles,
  Utensils,
  Hammer,
  HeartPulse,
  ShieldCheck,
  Clock,
  Users,
  Award,
  MapPin,
  CalendarCheck,
  Star,
  Scissors,
  Dumbbell,
  Scale,
  PawPrint,
  Wrench,
  Building2,
} from "lucide-react";

export interface AiContent {
  kicker?: string;
  headline?: string;
  subheadline?: string;
  services?: { title: string; desc: string }[];
  differentials?: { title: string; desc: string }[];
  about_title?: string;
  about_text?: string;
  social_proof?: string;
  cta_text?: string;
}

export interface PublicLead {
  id: string;
  company_name: string;
  segment: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  website_status: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  google_maps_url: string | null;
  socials: { instagram?: string; facebook?: string; linkedin?: string } | null;
  brand_colors: string[] | null;
  logo_url: string | null;
  opening_hours: string | null;
  price_level: string | null;
  photos: string[] | null;
  ai_content: AiContent | null;
}

/** Content ready to render: AI copy layered over the segment template, icons attached. */
export interface ResolvedContent {
  kicker: string;
  headline: string;
  subheadline: string;
  services: Item[];
  differentials: Item[];
  aboutTitle: string;
  aboutText: string;
  socialProof: string;
  ctaText: string;
}

export interface Item {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface SegmentContent {
  kicker: string;
  headline: (name: string, city: string | null) => string;
  subheadline: string;
  services: Item[];
  ctaText: string;
}

const GENERIC_DIFF: Item[] = [
  { icon: Award, title: "Qualidade reconhecida", desc: "Um negócio bem avaliado por quem já é cliente." },
  { icon: Users, title: "Atendimento humano", desc: "Você tratado com atenção do primeiro contato ao pós." },
  { icon: CalendarCheck, title: "Agendamento fácil", desc: "Fale pelo WhatsApp e resolva em minutos." },
  { icon: ShieldCheck, title: "Confiança", desc: "Transparência e compromisso em cada detalhe." },
];

export const DIFFERENTIALS = GENERIC_DIFF;

const CONTENT: { match: RegExp; content: SegmentContent }[] = [
  {
    match: /odonto|dent|orto|sorriso/i,
    content: {
      kicker: "Odontologia",
      headline: (n, c) => `${n}: o sorriso que ${c ?? "a sua cidade"} confia`,
      subheadline:
        "Tratamentos modernos, resultados que transformam autoestima e um atendimento que acolhe. Agende sua avaliação hoje mesmo.",
      services: [
        { icon: Smile, title: "Ortodontia", desc: "Aparelhos e alinhadores para um sorriso alinhado." },
        { icon: Sparkles, title: "Clareamento", desc: "Dentes mais brancos com segurança." },
        { icon: Award, title: "Implantes", desc: "Recupere a mordida e a confiança." },
        { icon: HeartPulse, title: "Harmonização facial", desc: "Estética facial com naturalidade." },
        { icon: Users, title: "Odontopediatria", desc: "Cuidado especial para os pequenos." },
        { icon: ShieldCheck, title: "Próteses", desc: "Soluções fixas e removíveis sob medida." },
      ],
      ctaText: "Agendar avaliação",
    },
  },
  {
    match: /est[eé]tica|pele|dermato|beleza|cosm/i,
    content: {
      kicker: "Estética & Beleza",
      headline: (n, c) => `${n}: sua melhor versão em ${c ?? "cada detalhe"}`,
      subheadline:
        "Protocolos personalizados, tecnologia e mãos especializadas para realçar sua beleza com naturalidade.",
      services: [
        { icon: Sparkles, title: "Limpeza de pele", desc: "Pele renovada e saudável." },
        { icon: HeartPulse, title: "Botox & preenchimento", desc: "Rejuvenescimento natural." },
        { icon: Scissors, title: "Tratamentos faciais", desc: "Protocolos sob medida." },
        { icon: Award, title: "Corporais", desc: "Resultados que você sente e vê." },
      ],
      ctaText: "Agendar sessão",
    },
  },
  {
    match: /cl[ií]nica|m[eé]dic|sa[uú]de|consult[oó]rio|nutri/i,
    content: {
      kicker: "Saúde",
      headline: (n, c) => `${n}: cuidado com a sua saúde em ${c ?? "sua cidade"}`,
      subheadline:
        "Profissionais especializados, estrutura moderna e um atendimento que coloca você em primeiro lugar.",
      services: [
        { icon: Stethoscope, title: "Consultas", desc: "Avaliação completa e humanizada." },
        { icon: HeartPulse, title: "Especialidades", desc: "Cuidado para cada necessidade." },
        { icon: ShieldCheck, title: "Convênios", desc: "Facilidade no seu atendimento." },
        { icon: CalendarCheck, title: "Prevenção", desc: "Saúde em dia o ano todo." },
      ],
      ctaText: "Agendar consulta",
    },
  },
  {
    match: /restaurant|churrasc|pizzar|lanch|food|bar|caf[eé]|buffet|padaria/i,
    content: {
      kicker: "Gastronomia",
      headline: (n, c) => `${n}: sabor que faz ${c ?? "a cidade"} voltar`,
      subheadline:
        "Ingredientes selecionados, ambiente acolhedor e um atendimento que faz cada visita valer a pena.",
      services: [
        { icon: Utensils, title: "Cardápio", desc: "Pratos que conquistam no primeiro sabor." },
        { icon: CalendarCheck, title: "Reservas", desc: "Garanta sua mesa em segundos." },
        { icon: MapPin, title: "Delivery", desc: "Peça e receba onde estiver." },
        { icon: Users, title: "Eventos", desc: "Seu evento com o nosso toque especial." },
      ],
      ctaText: "Fazer reserva",
    },
  },
  {
    match: /constru|marmor|pedra|reforma|engenh|arquitet|material/i,
    content: {
      kicker: "Construção & Reformas",
      headline: (n, c) => `${n}: sua obra bem feita em ${c ?? "sua região"}`,
      subheadline:
        "Materiais de qualidade, acabamento impecável e prazos que você pode confiar. Peça seu orçamento.",
      services: [
        { icon: Hammer, title: "Execução", desc: "Do projeto à entrega, sem dor de cabeça." },
        { icon: Building2, title: "Materiais", desc: "Qualidade que dura." },
        { icon: Award, title: "Acabamento", desc: "Detalhes que fazem a diferença." },
        { icon: CalendarCheck, title: "Orçamento rápido", desc: "Fale conosco e receba sua proposta." },
      ],
      ctaText: "Pedir orçamento",
    },
  },
  {
    match: /academia|fitness|cross|pilates|gym/i,
    content: {
      kicker: "Fitness",
      headline: (n, c) => `${n}: seu melhor shape começa em ${c ?? "sua cidade"}`,
      subheadline: "Estrutura completa, profissionais dedicados e um ambiente que te motiva a evoluir.",
      services: [
        { icon: Dumbbell, title: "Musculação", desc: "Treinos para o seu objetivo." },
        { icon: HeartPulse, title: "Aulas", desc: "Turmas para todos os níveis." },
        { icon: Users, title: "Acompanhamento", desc: "Profissionais com você sempre." },
        { icon: Award, title: "Resultados", desc: "Evolução que você vê no espelho." },
      ],
      ctaText: "Matricule-se",
    },
  },
  {
    match: /pet|veterin|animal/i,
    content: {
      kicker: "Pet",
      headline: (n, c) => `${n}: carinho pro seu melhor amigo em ${c ?? "sua cidade"}`,
      subheadline: "Cuidado, saúde e amor pelos animais — com a confiança que o seu pet merece.",
      services: [
        { icon: PawPrint, title: "Banho & tosa", desc: "Seu pet limpo e feliz." },
        { icon: HeartPulse, title: "Veterinário", desc: "Saúde em boas mãos." },
        { icon: ShieldCheck, title: "Vacinas", desc: "Proteção em dia." },
        { icon: Award, title: "Pet shop", desc: "Tudo que seu pet precisa." },
      ],
      ctaText: "Agendar",
    },
  },
  {
    match: /advoc|jur[ií]dic|contab|escrit[oó]rio/i,
    content: {
      kicker: "Serviços profissionais",
      headline: (n, c) => `${n}: soluções de confiança em ${c ?? "sua cidade"}`,
      subheadline: "Experiência, seriedade e um atendimento próximo para resolver o que importa.",
      services: [
        { icon: Scale, title: "Consultoria", desc: "Orientação clara e segura." },
        { icon: ShieldCheck, title: "Assessoria", desc: "Acompanhamento completo." },
        { icon: Award, title: "Experiência", desc: "Resultados comprovados." },
        { icon: CalendarCheck, title: "Atendimento", desc: "Fale conosco quando precisar." },
      ],
      ctaText: "Falar agora",
    },
  },
];

const GENERIC: SegmentContent = {
  kicker: "Bem-vindo",
  headline: (n, c) => `${n}: qualidade e confiança em ${c ?? "sua cidade"}`,
  subheadline:
    "Atendimento de excelência e o cuidado que você procura. Fale com a gente e descubra a diferença.",
  services: [
    { icon: Award, title: "Qualidade", desc: "Excelência em cada atendimento." },
    { icon: Wrench, title: "Nossos serviços", desc: "Soluções sob medida para você." },
    { icon: Users, title: "Atendimento", desc: "Pessoas cuidando de pessoas." },
    { icon: Clock, title: "Praticidade", desc: "Resolva tudo com facilidade." },
  ],
  ctaText: "Fale conosco",
};

export function contentForSegment(segment: string | null): SegmentContent {
  if (segment) {
    for (const { match, content } of CONTENT) if (match.test(segment)) return content;
  }
  return GENERIC;
}

const DIFF_ICONS: LucideIcon[] = [Award, Users, CalendarCheck, ShieldCheck];

/**
 * Build the render-ready content for a lead. When `ai_content` is present
 * (generated per-lead by Claude) its copy overrides the segment template;
 * otherwise the keyword-matched template is used. Icons always come from the
 * template so the layout stays consistent.
 */
export function resolveContent(lead: PublicLead): ResolvedContent {
  const base = contentForSegment(lead.segment);
  const ai = lead.ai_content ?? {};
  const name = lead.company_name;

  const services: Item[] =
    ai.services && ai.services.length
      ? ai.services.slice(0, 6).map((s, i) => ({
          icon: base.services[i % base.services.length].icon,
          title: s.title,
          desc: s.desc,
        }))
      : base.services;

  const differentials: Item[] =
    ai.differentials && ai.differentials.length
      ? ai.differentials.slice(0, 4).map((d, i) => ({
          icon: DIFF_ICONS[i % DIFF_ICONS.length],
          title: d.title,
          desc: d.desc,
        }))
      : DIFFERENTIALS;

  return {
    kicker: ai.kicker?.trim() || base.kicker,
    headline: ai.headline?.trim() || base.headline(name, lead.city),
    subheadline: ai.subheadline?.trim() || base.subheadline,
    services,
    differentials,
    aboutTitle: ai.about_title?.trim() || "Experiência que gera confiança",
    aboutText:
      ai.about_text?.trim() ||
      "Cada detalhe pensado para você ter a melhor experiência, do primeiro contato ao resultado final.",
    socialProof:
      ai.social_proof?.trim() ||
      `Quem conhece a ${name} confia e recomenda. Venha viver essa experiência você também.`,
    ctaText: ai.cta_text?.trim() || base.ctaText,
  };
}

export { Star, MapPin, Clock };
