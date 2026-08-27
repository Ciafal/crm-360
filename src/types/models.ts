export type CategoryColor =
  | 'slate'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'

import type { RecordModel } from 'pocketbase'

export interface Category extends RecordModel {
  id: string
  account_id: string
  name: string
  color: CategoryColor
  icon?: string
  created_by?: string
  created: string
  updated: string
}

export interface Account {
  id: string
  name: string
  owner_id: string
  created: string
  updated: string
}

export interface AccountMember {
  id: string
  account_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at?: string
  created: string
  updated: string
}

export interface AccountInvite {
  id: string
  account_id: string
  email: string
  role: 'owner' | 'member'
  invited_by: string
  created: string
  updated: string
}

export interface AiAgent extends RecordModel {
  id: string
  account_id?: string
  user_id: string
  name: string
  system_prompt: string
  created: string
  updated: string
}

export type CiafalUserRole =
  | 'vendedor'
  | 'supervisor'
  | 'gerente_comercial'
  | 'diretoria'
  | 'administrativo'
  | 'ti'
  | 'administrador'
  | 'auditor'

export type CommercialMetric = 'TONS' | 'REVENUE'

export type ABCCategory = 'A' | 'B' | 'C'

export type DecisionRole =
  | 'Decisor'
  | 'Influenciador'
  | 'Comprador'
  | 'Técnico'
  | 'Financeiro'
  | 'Logística'
  | 'Outro'

export type PreferredContactChannel = 'WhatsApp' | 'Ligação' | 'E-mail' | 'Visita'

export type LeadStage =
  | 'Novo'
  | 'Qualificando'
  | 'Contato'
  | 'Necessidade'
  | 'Convertido'
  | 'Descartado'

export type WhatsAppMode = 'MOCK' | 'CLOUD_API' | 'COEX'

export interface CustomerPersonContact {
  id: string
  customerId: string
  name: string
  jobTitle: string
  department: string
  email: string
  phone: string
  whatsapp: string
  decisionRole: DecisionRole
  isPrimary: boolean
  preferredChannel: PreferredContactChannel
  lastContactDate?: string
  status: 'Ativo' | 'Inativo'
  notes?: string
}

export interface LeadItem {
  id: string
  leadName: string
  companyName: string
  cnpj?: string
  segment: string
  origin: string
  city: string
  uf: string
  potentialTons: number
  potentialValue: number
  leadPriorityABC: ABCCategory // LeadPriorityABC (A: Alta prioridade, B: Média, C: Baixa)
  stage: LeadStage
  score: number
  assignedSeller: string
  assignedSellerId: string
  lastContact?: string
  nextAction?: string
  productInterest: string
  urgency: 'Alta' | 'Média' | 'Baixa'
  createdAt: string
}

export interface AgentVersion {
  version: number
  createdAt: string
  updatedBy: string
  systemPrompt: string
  objective: string
  allowedUsers: string[]
  allowedData: string[]
  periodicity: string
  alerts: string[]
  allowedActions: string[]
  naturalLanguagePrompt?: string
}

export interface AgentRunLog {
  id: string
  agentId: string
  agentName: string
  version: number
  executedAt: string
  sources: string[]
  result: string
  confidence: number
  latencyMs: number
  error?: string
  tokenCount: number
  costEstimatedBrl: number
  triggeredBy: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role?: CiafalUserRole
  employee_id?: string
  team_id?: string
  manager_id?: string
  seller_code?: string
  ramal?: string
  telefone_corporativo?: string
  preferred_commercial_metric?: CommercialMetric
  active?: boolean
}

export interface Team extends RecordModel {
  id: string
  account_id?: string
  name: string
  manager_id?: string
  parent_team_id?: string
  expand?: {
    manager_id?: User
  }
  created: string
  updated: string
}

export interface SellerPortfolioRecord extends RecordModel {
  id: string
  seller_id: string
  customer_id: string
  account_id?: string
  created: string
  updated: string
}

export type CommercialActionType =
  | 'atacar_agora'
  | 'follow_up'
  | 'recuperar'
  | 'resolver_impedimento'
  | 'nao_priorizar'

export type CommercialActionStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'reagendada'
  | 'nao_realizada'
  | 'cancelada'

export interface DailyCommercialAction extends RecordModel {
  id: string
  account_id?: string
  seller_id: string
  customer_id: string
  customer_name?: string
  opportunity_id?: string
  date?: string
  action_type: CommercialActionType
  priority?: number
  recommendation?: string
  rationale?: string
  source?: string
  confidence?: number
  status: CommercialActionStatus
  due_at?: string
  completed_at?: string
  completion_channel?: string
  result?: string
  rescheduled_to?: string
  justification?: string
  generated_by?: string
  ai_run_id?: string
  potential_revenue?: number
  potential_tons?: number
  product_family?: string
  expand?: {
    seller_id?: User
  }
  created: string
  updated: string
}

export type RfmSegment =
  | 'Campeões'
  | 'Leais'
  | 'Potenciais'
  | 'Novos/ocasionais'
  | 'Precisam de atenção'
  | 'Em risco'
  | 'Prestes a hibernar'
  | 'Hibernando'
  | 'Perdidos'

export interface CustomerScore extends RecordModel {
  id: string
  account_id?: string
  customer_id: string
  seller_id?: string
  rfm_recency_score?: number
  rfm_frequency_score?: number
  rfm_monetary_score?: number
  rfm_segment?: RfmSegment | string
  bg_nbd_p_alive?: number
  bg_nbd_expected_frequency?: number
  gamma_gamma_expected_value?: number
  predicted_next_purchase_days?: number
  reactivation_score?: number
  model_version?: string
  calculated_at?: string
  source?: string
  created: string
  updated: string
}

export interface PurchaseRecurrence extends RecordModel {
  id: string
  account_id?: string
  customer_id: string
  year_month: string
  has_purchase?: boolean
  revenue?: number
  tons?: number
  product_family?: string
  created: string
  updated: string
}

export interface AIRecommendationRecord extends RecordModel {
  id: string
  account_id?: string
  seller_id?: string
  customer_id: string
  action_type?: string
  recommendation?: string
  rationale?: string
  evidence?: any[]
  confidence?: number
  source?: string
  model_version?: string
  ai_run_id?: string
  accepted?: boolean
  executed?: boolean
  result?: string
  created: string
  updated: string
}

export interface BISyncState extends RecordModel {
  id: string
  account_id?: string
  provider: string
  entity_type?: string
  last_synced_at?: string
  source_updated_at?: string
  status: 'idle' | 'syncing' | 'error'
  error_message?: string
  records_count?: number
  created: string
  updated: string
}

export interface WhatsappInstance extends RecordModel {
  id: string
  account_id?: string
  user_id: string
  instance_name: string
  instance_id?: string
  instance_hash?: string
  status: 'creating' | 'qrcode' | 'connected' | 'disconnected'
  phone_number?: string
  needs_initial_sync?: boolean
  needs_resync?: boolean
  auth_failure_count?: number
  qrcode_base64?: string
  is_importing_history?: boolean
  import_messages_count?: number
  import_started_at?: string
  import_finished_at?: string
  sync_period_days?: number
  created: string
  updated: string
}

export interface Conversation extends RecordModel {
  id: string
  account_id?: string
  user_id: string
  instance_name: string
  remote_jid: string
  contact_name?: string
  contact_phone?: string
  is_group?: boolean
  type: 'individual' | 'group'
  avatar?: string
  avatar_url?: string
  last_message?: string
  last_message_timestamp?: number
  unread_count: number
  group_size?: number
  history_synced_at?: string
  history_oldest_timestamp?: number
  archived?: boolean
  ai_agent_id?: string
  ai_enabled?: boolean
  ai_conversation_id?: string
  category_ids?: string[]
  created: string
  updated: string
}

export interface CrmContact extends RecordModel {
  id: string
  account_id?: string
  user_id?: string
  instance_name?: string
  jid: string
  phone?: string
  name?: string
  custom_name?: string
  push_name?: string
  contact_name?: string
  avatar_url?: string
  notes?: string
  stage: string
  last_synced_at?: string
  // Empresa (migration 0024)
  company_id?: string
  role?: string
  email?: string
  assigned_to?: string
  category_ids?: string[]
  // expand opcional do PB ao buscar com `?expand=company_id`
  expand?: {
    company_id?: CrmCompany
    assigned_to?: User
  }
  created: string
  updated: string
}

export interface CrmCompany extends RecordModel {
  id: string
  account_id?: string
  user_id: string
  name: string
  cnpj?: string
  website?: string
  linkedin_url?: string
  industry?: string
  size?: string
  logo_url?: string
  notes?: string
  created: string
  updated: string
}

export interface WhatsappMessage extends RecordModel {
  id: string
  account_id?: string
  user_id: string
  instance_name: string
  remote_jid: string
  from_me: boolean
  message_id?: string
  push_name?: string
  content?: string
  message_type?: string
  media_file?: string
  media_url?: string
  media_mimetype?: string
  media_filename?: string
  status?: string
  timestamp?: number
  participant_jid?: string
  participant_pushname?: string
  reactions?: any
  link_url?: string
  link_title?: string
  link_description?: string
  link_thumbnail_b64?: string
  created: string
  updated: string
}

export interface Task extends RecordModel {
  id: string
  account_id?: string
  user_id: string
  title: string
  description?: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  priority: 'baixa' | 'media' | 'alta' | 'urgente'
  due_date?: string
  crm_contact_id?: string
  crm_company_id?: string
  conversation_id?: string
  linked_message_ids?: string[]
  completed_at?: string
  assigned_to?: string
  expand?: {
    assigned_to?: User
  }
  created: string
  updated: string
}

export type VisitType = 'COMMERCIAL_VISIT' | 'TECHNICAL_VISIT'
export type VisitStatus =
  | 'PLANEJADA'
  | 'EM_DESLOCAMENTO'
  | 'CHECK_IN'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA'
  | 'REAGENDADA'

export interface CommercialVisitFormData {
  objective?: string
  participants?: string
  customer_contact?: string
  identified_need?: string
  product?: string
  product_family?: string
  quantity?: string | number
  discussed_price?: string | number
  potential_volume?: string | number
  deadline?: string
  competitors?: string
  objections?: string
  commercial_conditions?: string
  opportunity_title?: string
  next_action?: string
  next_action_date?: string
  observations?: string
}

export interface TechnicalVisitFormData {
  technical_objective?: string
  application?: string
  product?: string
  material?: string
  dimension?: string
  specification?: string
  problem_description?: string
  symptom?: string
  technical_need?: string
  sample_collected?: string
  tests_performed?: string
  technical_recommendation?: string
  pendency?: string
  responsible_person?: string
  deadline?: string
  next_action?: string
  next_action_date?: string
  observations?: string
}

export interface Visit {
  id: string
  customer_id: string
  customer_name: string
  sap_code: string
  city: string
  uf: string
  contact_name: string
  type: VisitType
  status: VisitStatus
  planned_date: string
  planned_time: string
  objective: string
  participants?: string
  user_id: string // vendedor responsável
  seller_name?: string
  supervisor_id?: string
  latitude?: number
  longitude?: number
  target_latitude?: number
  target_longitude?: number
  gps_accuracy?: number
  is_within_geofence?: boolean
  geofence_distance_meters?: number
  checkout_latitude?: number
  checkout_longitude?: number
  started_at?: string
  ended_at?: string
  duration_minutes?: number
  form_data?: CommercialVisitFormData | TechnicalVisitFormData | Record<string, any>
  audio_url?: string
  audio_transcription?: string
  ai_summary?: string
  ai_summary_status?: 'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | 'EDITED'
  next_action?: string
  next_action_date?: string
  created_at?: string
  updated_at?: string
}
