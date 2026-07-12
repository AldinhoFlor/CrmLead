import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProposalSite } from "@/components/proposal/proposal-site";
import type { PublicLead } from "@/lib/proposal-content";

export const dynamic = "force-dynamic";

async function getLead(id: string): Promise<PublicLead | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_lead", { p_id: id });
  return (data as PublicLead) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return { title: "Proposta" };
  return {
    title: `${lead.company_name}${lead.city ? ` · ${lead.city}` : ""}`,
    description: `Conheça a ${lead.company_name}. Atendimento de qualidade${
      lead.city ? ` em ${lead.city}` : ""
    }.`,
  };
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead || !lead.company_name) notFound();
  return <ProposalSite lead={lead} />;
}
