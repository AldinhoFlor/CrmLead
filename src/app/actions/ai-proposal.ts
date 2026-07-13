"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AiContent } from "@/lib/proposal-content";

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
  ],
} as const;

function buildPrompt(lead: Record<string, unknown>): string {
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
  return `Você é um copywriter brasileiro especialista em landing pages que vendem. Escreva o texto de um site de vendas (uma página) para a empresa abaixo. O objetivo é convencer o cliente final dessa empresa a entrar em contato pelo WhatsApp.

Dados reais da empresa (use o que fizer sentido, ignore campos nulos):
${JSON.stringify(info, null, 2)}

Regras:
- Português do Brasil, tom profissional, caloroso e persuasivo — nada genérico ou com "cara de IA".
- Fale com o CLIENTE da empresa (não com o dono). Não invente fatos, preços, prêmios nem números que não estão nos dados.
- headline: curta e impactante, cite o nome da empresa e a cidade quando houver.
- subheadline: 1 a 2 frases que reforcem o valor e chamem para a ação.
- services: 6 itens plausíveis para o segmento; title de 1-3 palavras, desc de até ~8 palavras.
- differentials: exatamente 4 motivos para escolher a empresa; title curto, desc de até ~10 palavras.
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

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: process.env.PROPOSAL_AI_MODEL || "claude-opus-4-8",
      max_tokens: 2048,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: buildPrompt(lead) }],
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
