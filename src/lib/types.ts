export type LeadPriority = "baixa" | "media" | "alta";
export type LeadSource =
  | "google"
  | "manual"
  | "indicacao"
  | "importacao"
  | "instagram"
  | "outro";
export type WebsiteStatus = "sem_site" | "desatualizado" | "basico" | "bom";
export type ActivityType =
  | "nota"
  | "ligacao"
  | "whatsapp"
  | "email"
  | "reuniao"
  | "proposta_enviada"
  | "mudanca_estagio"
  | "mudanca_status";
export type ChipStatus =
  | "novo"
  | "aquecendo"
  | "ativo"
  | "descanso"
  | "sinalizado"
  | "banido"
  | "inativo";
export type ChipEventType =
  | "aquecimento"
  | "entrada"
  | "saida"
  | "mudanca_status"
  | "sinalizado"
  | "descanso"
  | "selecionado";

export interface PipelineStage {
  id: string;
  owner_id: string | null;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  owner_id: string | null;
  stage_id: string | null;
  position: number;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  website_status: WebsiteStatus | null;
  segment: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  source: LeadSource | null;
  priority: LeadPriority | null;
  estimated_value: number | null;
  monthly_revenue: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  google_maps_url: string | null;
  logo_url: string | null;
  brand_colors: string[] | null;
  socials: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
  } | null;
  extra_emails: string[] | null;
  opening_hours: string | null;
  price_level: string | null;
  notes: string | null;
  tags: string[] | null;
  is_archived: boolean;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  owner_id: string | null;
  lead_id: string;
  type: ActivityType;
  content: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Chip {
  id: string;
  owner_id: string | null;
  label: string;
  phone_number: string;
  provider: string | null;
  evolution_instance: string | null;
  status: ChipStatus;
  health_score: number;
  is_connected: boolean;
  in_rotation: boolean;
  rotation_weight: number;
  daily_limit: number;
  sent_today: number;
  total_sent: number;
  warmup_day: number;
  warmup_target_days: number;
  last_used_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChipEvent {
  id: string;
  chip_id: string;
  type: ChipEventType;
  detail: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AppSettings {
  owner_id: string;
  warmup_min_per_day: number;
  warmup_max_per_day: number;
  rotation_strategy: string;
  evolution_base_url: string | null;
  n8n_webhook_url: string | null;
  data: Record<string, unknown>;
  updated_at: string;
}
