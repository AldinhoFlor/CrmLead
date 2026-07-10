# LeadForge CRM

CRM moderno para **captação de leads e envio de propostas** — focado em empresas
que já faturam bem mas não têm site (ou têm um site feio/antigo). Esta é a
**Fase 1: o CRM**. As fases seguintes (pesquisa automática no Google, geração de
sites personalizados por logo/paleta, e disparo via Evolution API + n8n) plugam
sobre esta base.

## O que já está pronto (Fase 1)

- **Dashboard** com KPIs animados, funil de conversão e visão da infra de disparo.
- **Kanban completo** do funil de vendas com drag-and-drop entre estágios,
  ordenação e animações (dnd-kit + Framer Motion). Cada movimento persiste e
  registra atividade automaticamente.
- **Leads**: base completa com busca e filtros, página de detalhe com edição
  inline, timeline de atividades (nota, ligação, WhatsApp, e-mail, reunião,
  proposta) e "identidade da marca" (cores) preparada para gerar sites depois.
- **Chips & Aquecedor**:
  - Cadastro de números de WhatsApp com status, saúde, limite diário e peso.
  - **Aquecedor** com ramp gradual de dias/limites e métricas de saúde.
  - **Randomizador de chip** com 3 estratégias (ponderada, round-robin, menos
    usado). A seleção é **atômica no banco** (incrementa contadores e registra o
    evento) — é a mesma função que a Evolution API/n8n vão chamar na Fase 2.
- **Configurações** de aquecimento, rotação e endpoints de integração (Fase 2).
- Autenticação via Supabase Auth (uso pessoal) e **RLS** por dono em todas as
  tabelas.

## Stack

- **Next.js 15** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Framer Motion** (motions) + **lucide-react**
- **Supabase** (Postgres + Auth + RLS) — projeto `crm-lead`
- **@dnd-kit** para o Kanban
- Deploy na **Vercel**

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local   # preencha URL e chave do Supabase
pnpm dev
```

Acesse http://localhost:3000. As credenciais de acesso são enviadas
separadamente (usuário único já criado no Supabase).

### Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave publishable/anon |

## Modelo de dados (Supabase)

- `pipeline_stages` — colunas do Kanban (defaults globais + por usuário)
- `leads` — empresas prospectadas (dados, enriquecimento do Google, marca)
- `activities` — timeline por lead
- `proposals` — propostas/sites (schema pronto para a Fase 2)
- `chips` — números de WhatsApp (saúde, aquecimento, rotação)
- `chip_events` — log de aquecimento e seleções do randomizador
- `app_settings` — parâmetros de aquecimento/rotação e URLs de integração

Funções SQL: `pick_chip(strategy)` (randomizador atômico),
`advance_chip_warmup(chip_id)` (ramp de aquecimento) e
`reset_daily_chip_counters()`.

## Roadmap (próximas fases)

1. **Captação no Google** → pesquisa e enriquecimento automático de leads.
2. **Geração de sites personalizados** por lead usando logo e paleta de cores.
3. **Disparo automático** de propostas via **Evolution API + n8n**, consumindo
   o randomizador e o aquecedor já prontos aqui.
