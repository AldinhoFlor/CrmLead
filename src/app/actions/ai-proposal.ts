"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AiContent } from "@/lib/proposal-content";
import { fetchSiteText } from "@/lib/site-scrape";

const DEFAULT_MODEL = "claude-opus-4-8";

// JSON schema that constrains Claude's output to exactly the copy we render,
// so there is nothing to clean up or risk of leaked reasoning text.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    kicker: { type: "string" },
    headline: { type: "string" },
    subheadline: { type: "string" },
    about_title: { type: "string" },
    about_text: { type: "string" },
    social_proof: { type: "string" },
    cta_text: { type: "string" },
    services: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          desc: { type: "string" },
        },
        required: ["title", "desc"],
      },
    },
    differentials: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          desc: { type: "string" },
        },
        required: ["title", "desc"],
      },
    },
    offers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          desc: { type: "string" },
          highlight: { type: "boolean" },
        },
        required: ["title", "desc", "highlight"],
      },
    },
  },
  required: [
    "kicker",
    "headline",
    "subheadline",
    "about_title",
    "about_text",
    "social_proof",
    "cta_text",
    "services",
    "differentials",
    "offers",
  ],
} as const;

function buildPrompt(lead: Record<string, unknown>, siteText: string | null): string {
  const info = {
    empresa: lead.company_name,
    segmento: lead.segment,
    cidade: lead.city,
    estado: lead.state,
    endereco: lead.address,
    nota_google: lead.google_rating,
    avaliacoes_google: lead.google_reviews_count,
    tem_site: lead.website ? "sim" : "não",
    horario: lead.opening_hours,
    faixa_preco: lead.price_level,
  };
  const siteBlock = siteText
    ? `\n\nConteúdo REAL extraído do site atual da empresa (baseie os textos e serviços nisto, sem copiar literalmente e sem inventar o que não está aqui):\n"""\n${siteText}\n"""`
    : "";
  return `Você é um copywriter brasileiro especialista em landing pages que vendem. Escreva o texto de um site de vendas (uma página) para a empresa abaixo. O objetivo é convencer o cliente final dessa empresa a entrar em contato pelo WhatsApp.

Dados reais da empresa (use o que fizer sentido, ignore campos nulos):
${JSON.stringify(info, null, 2)}${siteBlock}

Regras:
- Português do Brasil, tom profissional, caloroso e persuasivo — nada genérico ou com "cara de IA".
- Fale com o CLIENTE da empresa (não com o dono). Não invente fatos, preços, prêmios nem números que não estão nos dados.
- headline: curta e impactante, cite o nome da empresa e a cidade quando houver.
- subheadline: 1 a 2 frases que reforcem o valor e chamem para a ação.
- services: 6 itens plausíveis para o segmento; title de 1-3 palavras, desc de até ~8 palavras.
- differentials: exatamente 4 motivos para escolher a empresa; title curto, desc de até ~10 palavras.
- offers: 3 formas de contratar/começar, adequadas AO SEGMENTO (ex.: avaliação inicial, plano/pacote, acompanhamento contínuo) — NUNCA invente preços; desc de até ~12 palavras; marque highlight=true em no máximo uma (a recomendada) e false nas demais.
- about_title e about_text: seção "por que nos escolher" (about_text com 1-2 frases).
- social_proof: 1 frase de prova social citando o nome da empresa (sem inventar números).
- cta_text: 2-4 palavras (ex: "Agendar agora", "Falar no WhatsApp").
- kicker: rótulo curto do segmento (ex: "Odontologia", "Estética & Beleza").`;
}

/**
 * Generate unique, per-lead marketing copy with Claude and store it on the lead.
 * The proposal page (`resolveContent`) prefers this copy over the segment template.
 */
export async function generateProposalCopy(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return {
      error:
        "Falta a chave da IA. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente da Vercel.",
    };

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select(
      "id, company_name, segment, city, state, address, website, google_rating, google_reviews_count, opening_hours, price_level"
    )
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) return { error: "Lead não encontrado." };

  // Pull the business's real site content so the copy is theirs, not invented.
  const siteText = await fetchSiteText(lead.website as string | null);

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: process.env.PROPOSAL_AI_MODEL || DEFAULT_MODEL,
      max_tokens: 2048,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: buildPrompt(lead, siteText) }],
    });

    if (res.stop_reason === "refusal")
      return { error: "A IA recusou gerar este conteúdo. Tente outro lead." };

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    let ai: AiContent;
    try {
      ai = JSON.parse(text) as AiContent;
    } catch {
      return { error: "Resposta da IA inválida. Tente novamente." };
    }

    const { error: upErr } = await supabase
      .from("leads")
      .update({ ai_content: ai })
      .eq("id", leadId);
    if (upErr) return { error: upErr.message };

    revalidatePath(`/leads/${leadId}`);
    revalidatePath(`/proposta/${leadId}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return { error: `Falha ao gerar com IA: ${msg}` };
  }
}

const EMAIL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
} as const;

export interface ProposalEmail {
  subject: string;
  body: string;
}

/**
 * Write the outreach email for a lead: genuine rapport from their Google
 * reviews, a note that you built a new version of their page, and the link —
 * no price (that scares the click). Returns the email text to copy & send.
 */
export async function generateProposalEmail(leadId: string, proposalUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return {
      error:
        "Falta a chave da IA. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente da Vercel.",
    };

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select(
      "id, company_name, contact_name, segment, city, state, website, website_status, google_rating, google_reviews_count"
    )
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) return { error: "Lead não encontrado." };

  const siteText = await fetchSiteText(lead.website as string | null, 2500);

  const info = {
    empresa: lead.company_name,
    contato: lead.contact_name,
    segmento: lead.segment,
    cidade: lead.city,
    nota_google: lead.google_rating,
    avaliacoes_google: lead.google_reviews_count,
    site_atual: lead.website,
    situacao_do_site: lead.website_status,
  };

  const prompt = `Você é um consultor que cria páginas de vendas para negócios bem avaliados que têm um site fraco ou desatualizado. Escreva um e-mail de PRIMEIRA abordagem para o dono desse negócio, oferecendo uma nova versão da página dele.

Dados do lead (ignore campos nulos):
${JSON.stringify(info, null, 2)}
${siteText ? `\nTrecho do site atual dele (use para elogiar algo específico):\n"""\n${siteText}\n"""\n` : ""}
Link da NOVA página que já foi criada para ele: ${proposalUrl}

Regras do e-mail:
- Português do Brasil, curto (4 a 7 frases), humano e próximo — NADA de cara de spam ou de robô.
- Comece com um elogio VERDADEIRO e específico (cite a boa reputação/avaliações no Google, ou algo do trabalho dele). Rapport genuíno.
- Diga que notou pontos a melhorar no site atual e que, por isso, já montou uma nova versão da página dele.
- Cite 1 ou 2 melhorias concretas.
- CTA claro para ele ABRIR o link e navegar. Trate o link como algo pronto para ver.
- NÃO fale preço, não peça reunião logo de cara. Só convide para abrir a página.
- subject: assunto curto e pessoal que dê vontade de abrir (sem "PROPOSTA" em caixa alta, sem clickbait).
- body: o corpo do e-mail em texto simples, com quebras de linha e uma saudação; deixe a assinatura como "[Seu nome]".`;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: process.env.PROPOSAL_AI_MODEL || DEFAULT_MODEL,
      max_tokens: 1200,
      output_config: { format: { type: "json_schema", schema: EMAIL_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });

    if (res.stop_reason === "refusal")
      return { error: "A IA recusou gerar este e-mail. Tente outro lead." };

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    try {
      const email = JSON.parse(text) as ProposalEmail;
      return { ok: true as const, email };
    } catch {
      return { error: "Resposta da IA inválida. Tente novamente." };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return { error: `Falha ao gerar e-mail: ${msg}` };
  }
}
