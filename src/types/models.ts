import type { RecordModel } from 'pocketbase'

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
  | 'representante_externo'

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

export type CommercialArchetype = 'INDÚSTRIA' | 'REVENDA' | 'SERRALHERIA' | 'CONSUMIDOR_FINAL'

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
  birthday_day?: number
  birthday_month?: number
  marketing_eligible?: boolean
  marketing_opt_in?: boolean
  preferred_marketing_channel?: PreferredContactChannel
  relationship_tags?: string[]
}

export interface CommercialPlaybook {
  id: string
  customer_archetype: CommercialArchetype
  name: string
  objectives: string[]
  recommended_approach: string
  questions_to_ask: string[]
  signals_to_watch: string[]
  objections: { objection: string; recommended_response: string }[]
  recommended_channels: PreferredContactChannel[]
  recommended_cadence: string
  forbidden_patterns: string[]
  created_by: string
  version: string
  status: 'ATIVO' | 'RASCUNHO' | 'ARQUIVADO'
  updated_at: string
  change_reason?: string
}

export type FeatureStatusClassification =
  | 'IMPLEMENTADO'
  | 'MOCK'
  | 'PREPARADO'
  | 'PENDENTE DE CREDENCIAL'
  | 'PENDENTE DE MAPEAMENTO SAP'
  | 'PENDENTE DE ADMIN CONSENT'
  | 'PENDENTE DE DECISÃO'

export interface SAPCreditData {
  customerId: string
  sapCode: string
  creditLimit: number
  creditExposure: number // Crédito utilizado
  creditAvailable: number
  utilizationPercent: number
  receivablesTotal: number
  receivablesOpenNotDue: number // A vencer
  receivablesOverdue: number // Vencido
  maxDelayDays: number
  creditStatus: 'REGULAR' | 'RESTRITO' | 'BLOQUEADO'
  creditBlockReason?: string
  paymentTerms: string
  lastCheckedAt: string
  isCached: boolean
  rawF35Data?: Record<string, any>
  systemSource: 'SAP ECC' | 'MOCK'
}

export type TMSLoadStatus =
  | 'ORDER_PREPARATION'
  | 'IN_DISPATCH'
  | 'LOAD_FORMED'
  | 'LOAD_LOADED'
  | 'LOAD_DISPATCHED'
  | 'LOAD_IN_TRANSIT'
  | 'LOAD_DELIVERED'
  | 'LOGISTICS_EXCEPTION'

export interface TMSDeliveryLoad {
  id: string
  customerId: string
  orderNumber: string
  nfNumber: string
  carrierName: string
  vehiclePlate: string
  driverName: string
  tons: number
  itemsDescription: string
  status: TMSLoadStatus
  originCD: 'CD Contagem' | 'CD Betim' | 'Fábrica'
  destinationCity: string
  destinationUF: string
  estimatedDeliveryDate: string
  actualDeliveryDate?: string
  hasLogisticsException: boolean
  exceptionReason?: string
  trackingUrl?: string
  timelineEvents: {
    id: string
    event: TMSLoadStatus
    timestamp: string
    description: string
    location?: string
  }[]
}

export interface CustomerComplaint {
  id: string
  customerId: string
  customerName: string
  protocolNumber: string
  title: string
  category:
    | 'DIMENSIONAL'
    | 'SUPERFICIAL'
    | 'ENTREGA_ATRASO'
    | 'DIVERGENCIA_FATURA'
    | 'AVARIA_TRANSPORTE'
    | 'OUTROS'
  severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  status: 'ABERTA' | 'EM_ANALISE' | 'PLANO_DE_ACAO' | 'CONCLUIDA'
  isRecurrent: boolean
  recurrentCount?: number
  openedAt: string
  concludedAt?: string
  assignedTechnician: string
  actionPlanSummary?: string
  rootCause?: string
  performanceManagementId: string
}

export interface PortfolioAssignment {
  id: string
  customerId: string
  customerName: string
  customerSap: string
  previousOwnerId: string
  previousOwnerName: string
  newOwnerId: string
  newOwnerName: string
  assignmentType: 'TRANSFER' | 'TEMPORARY_ASSIGNMENT' | 'REACTIVATION_ASSIGNMENT'
  reason:
    | 'Reativação'
    | 'Redistribuição de carteira'
    | 'Mudança de região'
    | 'Especialização por segmento'
    | 'Cobertura'
    | 'Ausência'
    | 'Outro'
  assignedBy: string
  assignedAt: string
  effectiveFrom: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REVOKED'
  notes?: string
}

export interface RelationshipEvent {
  id: string
  name: string
  type:
    | 'ANIVERSARIO_CONTATO'
    | 'ANIVERSARIO_EMPRESA'
    | 'DATA_COMEMORATIVA'
    | 'DATA_SETORIAL'
    | 'CAMPANHA_COMERCIAL'
    | 'PROMOCAO'
    | 'LANCAMENTO_PRODUTO'
    | 'POS_VENDA'
    | 'RECOMPRA'
    | 'OUTROS'
  date_rule: string
  audience: string
  segment?: string
  archetype?: CommercialArchetype
  template: string
  channel: PreferredContactChannel
  owner: string
  status: 'ATIVO' | 'PAUSADO' | 'RASCUNHO'
  requires_approval: boolean
  lgpd_opt_in_required: boolean
}

export interface WorkflowStageChecklist {
  id: string
  title: string
  required: boolean
  isCompleted?: boolean
}

export interface CommercialWorkflowStage {
  id: string
  name: string
  description: string
  order: number
  slaHours: number
  checklists: WorkflowStageChecklist[]
  approverRole?: CiafalUserRole
  autoTransitionOnChecklist?: boolean
}

export interface CommercialAutomationRule {
  id: string
  name: string
  trigger:
    | 'CLIENTE_ALTERADO'
    | 'LEAD_CRIADO'
    | 'OPORTUNIDADE_CRIADA'
    | 'STAGE_ALTERADO'
    | 'COTACAO_CRIADA'
    | 'PEDIDO_CRIADO'
    | 'VISITA_CONCLUIDA'
    | 'INTERACAO_RECEBIDA'
    | 'CLIENTE_INATIVO'
    | 'COMPRA_REALIZADA'
    | 'RECLAMACAO_ABERTA'
    | 'CARGA_ATRASADA'
  conditions: {
    field: string
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in'
    value: any
  }[]
  actions: {
    type:
      | 'CREATE_TASK'
      | 'CREATE_DAILY_ACTION'
      | 'NOTIFY_USER'
      | 'ASSIGN_SELLER'
      | 'REQUEST_APPROVAL'
      | 'RUN_AI_AGENT'
      | 'UPDATE_CLASSIFICATION'
      | 'ADD_RELATIONSHIP_EVENT'
    payload: Record<string, any>
  }[]
  enabled: boolean
}

export interface DynamicFormField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean' | 'date'
  required: boolean
  conditionalArchetypes?: CommercialArchetype[]
  options?: string[]
  helpText?: string
}

export interface CPQQuoteItem {
  id: string
  materialCode: string
  description: string
  family: string
  quantityTons: number
  basePriceKg: number
  discountPercent: number
  finalPriceKg: number
  totalValue: number
  marginPercent?: number
  leadTimeDays: number
  freightType: 'CIF' | 'FOB'
}

export interface CPQCommercialQuote {
  id: string
  quoteNumber: string
  sapQuoteId?: string
  customerId: string
  customerName: string
  customerSap: string
  customerArchetype: CommercialArchetype
  sellerId: string
  sellerName: string
  items: CPQQuoteItem[]
  totalTons: number
  totalValue: number
  averageMarginPercent?: number
  paymentCondition: string
  freightTerms: string
  validUntil: string
  version: number
  status:
    | 'RASCUNHO'
    | 'EM_APROVACAO'
    | 'APROVADA'
    | 'REJEITADA'
    | 'ENVIADA_AO_CLIENTE'
    | 'CONVERTIDA_PEDIDO'
  approvalRequired: boolean
  approvalReason?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  history: {
    version: number
    date: string
    author: string
    changes: string
    status: string
  }[]
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
  leadPriorityABC: ABCCategory
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
  matricula?: string
  cargo?: string
  department?: string
  empresa?: string
  team_id?: string
  manager_id?: string
  manager_name?: string
  cost_center?: string
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
  company_id?: string
  role?: string
  email?: string
  assigned_to?: string
  category_ids?: string[]
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

export type GeoAccuracyLevel = 'ROOFTOP' | 'STREET' | 'APPROXIMATE' | 'CITY' | 'MANUAL'
export type GeoLocationStatus =
  | 'GEOCODED'
  | 'APPROXIMATE'
  | 'NOT_FOUND'
  | 'MANUAL_OVERRIDE'
  | 'PENDING'

export interface CustomerGeoLocation extends RecordModel {
  id: string
  account_id?: string
  customer_id: string
  sap_customer_code: string
  latitude: number
  longitude: number
  geocoding_source: string
  accuracy_level: GeoAccuracyLevel
  formatted_address: string
  geocoded_at: string
  last_validated_at: string
  status: GeoLocationStatus
  is_manual_override?: boolean
  manual_override_reason?: string
  manual_override_by?: string
  manual_override_at?: string
  created: string
  updated: string
}

export interface GeoLocationOverrideLog {
  id: string
  customer_id: string
  previous_lat: number
  previous_lng: number
  new_lat: number
  new_lng: number
  reason: string
  user_id: string
  user_name: string
  created_at: string
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
  user_id: string
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

// ==========================================
// 1. CENTRAL DE SOLICITAÇÕES CORPORATIVAS
// ==========================================

export type CorporateRequestType =
  | 'VIAGEM'
  | 'TREINAMENTO_INTERNO'
  | 'TREINAMENTO_EXTERNO'
  | 'VISITA_TECNICA_CLIENTE'
  | 'VISITA_FORNECEDOR'
  | 'VISITA_PARCEIRO'
  | 'REEMBOLSO'

export type CorporateRequestStatus =
  | 'RASCUNHO'
  | 'ENVIADO'
  | 'EM_APROVACAO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'EM_EXECUCAO'
  | 'CONCLUIDO'
  | 'CANCELADO'

export interface WorkflowAuditStep {
  id: string
  action: string
  user_id: string
  user_name: string
  role?: string
  timestamp: string
  comments?: string
  previous_status?: CorporateRequestStatus
  new_status?: CorporateRequestStatus
}

export interface CorporateRequestComment {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  timestamp: string
  content: string
}

export interface CorporateRequestAttachment {
  id: string
  name: string
  size_bytes: number
  uploaded_at: string
  url: string
  type?: string
}

export interface CorporateRequest {
  id: string
  code: string // Ex: SOL-2024-001
  request_type: CorporateRequestType
  title: string
  requester_id: string
  requester_name: string
  requester_email: string
  matricula?: string
  department: string
  cost_center: string
  manager_id: string
  manager_name: string
  current_approver_id: string
  current_approver_name: string
  current_approver_role: string
  status: CorporateRequestStatus
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  created_at: string
  submitted_at?: string
  approved_at?: string
  rejected_at?: string
  concluded_at?: string
  estimated_cost?: number
  currency: 'BRL' | 'USD' | 'EUR'
  justification: string
  // Payload específico por tipo
  type_data:
    | RequestViagemData
    | RequestTreinamentoInternoData
    | RequestTreinamentoExternoData
    | RequestVisitaTecnicaData
    | RequestVisitaFornecedorData
    | RequestVisitaParceiroData
    | RequestReembolsoData
    | Record<string, any>
  attachments: CorporateRequestAttachment[]
  comments: CorporateRequestComment[]
  audit_log: WorkflowAuditStep[]
  workflow_stage_index: number
  workflow_stages_total: number
}

// 1.1 Solicitação de Viagem
export interface RequestViagemData {
  destination: string
  origin: string
  departure_date: string
  return_date: string
  transport_type: 'AEREO' | 'CARRO_PROPRIO' | 'CARRO_LOCADO' | 'ONIBUS' | 'OUTRO'
  need_hotel: boolean
  hotel_nights?: number
  need_flight: boolean
  flight_preference?: string
  need_advance_payment: boolean
  advance_amount?: number
  related_entity_type?: 'CLIENTE' | 'FORNECEDOR' | 'PARCEIRO' | 'OUTRO'
  related_entity_id?: string
  related_entity_name?: string
  related_reimbursement_ids?: string[]
}

// 1.2 Treinamento Interno
export interface RequestTreinamentoInternoData {
  training_name: string
  objective: string
  instructor: string
  participants_count: number
  participants_list: string[]
  scheduled_date: string
  duration_hours: number
  need_room: boolean
  room_name?: string
  need_equipment: boolean
  equipment_details?: string
  cost: number
  competency_related: string
  integrated_with_hcm?: boolean
}

// 1.3 Treinamento Externo
export interface RequestTreinamentoExternoData {
  institution: string
  course_name: string
  city_uf: string
  modality: 'PRESENCIAL' | 'ONLINE_AO_VIVO' | 'EAD_GRAVADO' | 'HIBRIDO'
  registration_cost: number
  travel_cost?: number
  lodging_cost?: number
  expected_certificate: boolean
  certificate_url?: string
  certificate_uploaded_at?: string
  integrated_with_hcm?: boolean
}

// 1.4 Visita Técnica a Cliente
export interface RequestVisitaTecnicaData {
  customer_id: string
  sap_customer_code: string
  customer_name: string
  unit_address: string
  contacts: string
  objective: string
  reason: string
  seller_id: string
  seller_name: string
  representative_name?: string
  technical_lead: string
  participants: string
  visit_date: string
  visit_time: string
  location: string
  need_travel: boolean
  expected_result: string
  crm_integration_status?: 'SYNCED' | 'PENDING'
}

// 1.5 Visita a Fornecedor
export interface RequestVisitaFornecedorData {
  supplier_sap_code: string
  supplier_name: string
  unit_address: string
  srm_category?: string
  quality_focus?: boolean
  procurement_focus?: boolean
  audit_focus?: boolean
  project_related?: string
  objective: string
  participants: string
  visit_date: string
  expected_result: string
}

// 1.6 Visita a Parceiro
export interface RequestVisitaParceiroData {
  partner_name: string
  partner_category:
    | 'TECNOLOGIA'
    | 'ENGENHARIA'
    | 'COMERCIAL'
    | 'LOGISTICA'
    | 'CONSULTORIA'
    | 'OUTROS'
  unit_address: string
  objective: string
  participants: string
  visit_date: string
  expected_result: string
}

// 1.7 Solicitação de Reembolso
export interface RequestReembolsoData {
  expense_type: 'ALIMENTACAO' | 'TRANSPORTE' | 'HOSPEDAGEM' | 'COMBUSTIVEL' | 'PEDAGIO' | 'OUTROS'
  expense_date: string
  amount: number
  currency: 'BRL' | 'USD' | 'EUR'
  related_trip_request_id?: string
  related_trip_code?: string
  receipts_count: number
  erp_status?: 'NOT_INTEGRATED' | 'READY_FOR_ERP' | 'INTEGRATED' | 'PAID'
}

// ==========================================
// 2. GOVERNANÇA & COMPLIANCE DO COLABORADOR
// ==========================================

export type SignatureLevel = 'ELECTRONIC' | 'DIGITAL'
export type DigitalSignatureProviderType = 'D4SIGN' | 'DOCUSIGN' | 'NONE'

export interface CompliancePolicyType {
  id: string
  name: string
  category:
    | 'SEGURANCA_INFORMACAO'
    | 'CONDUTA_ETICA'
    | 'PRIVACIDADE_LGPD'
    | 'RECURSOS_TI'
    | 'COMUNICACAO_CORPORATIVA'
    | 'EQUIPAMENTOS'
    | 'INTELIGENCIA_ARTIFICIAL'
    | 'TREINAMENTO_OBRIGATORIO'
    | 'OUTROS'
  description: string
  current_version: string
  validity_months: number
  is_mandatory: boolean
  target_audience: 'TODOS' | 'SETOR_ESPECIFICO' | 'CARGO_ESPECIFICO' | 'EMPRESA_ESPECIFICA'
  target_department?: string
  target_role?: string
  target_company?: string
  requires_reacceptance_on_new_version: boolean
  status: 'ATIVO' | 'RASCUNHO' | 'INATIVO'
  // Campos de Assinatura Digital / Validade Jurídica
  signature_level?: SignatureLevel
  digital_signature_provider?: DigitalSignatureProviderType
  signature_deadline_days?: number
  created_at: string
  updated_at: string
}

export interface PolicyDocumentVersion {
  id: string
  policy_id: string
  policy_name: string
  version: string
  effective_date: string
  status: 'PUBLICADO' | 'RASCUNHO' | 'ARQUIVADO'
  content_markdown: string
  file_url?: string
  document_hash: string // SHA-256 do documento para integridade
  created_by: string
  approved_by: string
  approved_at: string
}

export type AcceptanceStatus =
  | 'EM_CONFORMIDADE'
  | 'PENDENTE_REACEITE'
  | 'REVOGADO'
  | 'PENDING_SIGNATURE'
  | 'SIGNED'
  | 'SIGNATURE_EXPIRED'
  | 'SIGNATURE_DECLINED'

export interface EmployeePolicyAcceptance {
  id: string
  employee_id: string
  employee_matricula: string
  employee_name: string
  employee_email: string
  employee_department: string
  employee_role: string
  policy_id: string
  policy_name: string
  policy_version: string
  accepted_at: string
  ip_address: string
  user_agent: string
  device_context: string
  authentication_method:
    | 'SESSAO_AUTENTICADA_QAS'
    | 'MFA_TOTP'
    | 'INTEGRACAO_CERTIFICADORA'
    | 'D4SIGN_DIGITAL_SIGNATURE'
    | 'DOCUSIGN_DIGITAL_SIGNATURE'
  document_hash: string
  acceptance_hash: string // Hash imutável gerado na confirmação
  status: AcceptanceStatus
  // Campos de Integração de Assinatura Digital
  signature_level?: SignatureLevel
  provider?: DigitalSignatureProviderType
  envelope_id?: string
  external_document_id?: string
  signature_hash?: string
  signed_at?: string
  viewed_at?: string
  expires_at?: string
  signed_document_url?: string
  signed_document_name?: string
  decline_reason?: string
}

export interface DigitalSignatureIntegrationConfig {
  active_provider: DigitalSignatureProviderType
  mode: 'mock' | 'live'
  default_template_id?: string
  default_role?: string
  d4sign_config: {
    api_key?: string
    crypt_key?: string
    account_id?: string
    base_url: string
    safe_name?: string
  }
  docusign_config: {
    account_id?: string
    integration_key?: string
    secret_key?: string
    base_url: string
    auth_server: string
    default_template_name?: string
  }
  last_tested_at?: string
  is_healthy?: boolean
}

export interface SignatureEnvelopeSummary {
  envelope_id: string
  acceptance_id: string
  policy_id: string
  policy_name: string
  policy_version: string
  employee_id: string
  employee_name: string
  employee_email: string
  employee_matricula: string
  employee_department: string
  provider: DigitalSignatureProviderType
  status: 'sent' | 'viewed' | 'signed' | 'declined' | 'expired' | 'canceled'
  created_at: string
  sent_at: string
  viewed_at?: string
  signed_at?: string
  expires_at?: string
  document_hash: string
  signature_hash?: string
  signed_document_url?: string
  signers: Array<{
    name: string
    email: string
    status: 'sent' | 'viewed' | 'signed' | 'declined'
    signed_at?: string
  }>
}

// ==========================================
// 3. PLANEJAMENTO ESTRATÉGICO SCHEMA & EXCEL
// ==========================================

export interface StrategicCycleItem {
  id: string
  ano_inicio: number
  ano_fim: number
  titulo: string
  missao: string
  visao: string
  valores: string
  status: 'ATIVO' | 'RASCUNHO' | 'CONCLUIDO'
}

export interface StrategicObjectiveItem {
  id: string
  codigo: string
  perspectiva:
    | 'FINANCEIRA'
    | 'CLIENTES_MERCADO'
    | 'PROCESSOS_INTERNOS'
    | 'PESSOAS_APRENDIZADO'
    | 'ESG'
  descricao: string
  meta_macro: string
  responsavel: string
  peso: number
}

export interface StrategicIndicatorItem {
  id: string
  codigo_objetivo: string
  codigo_kpi: string
  nome_kpi: string
  categoria: string
  unidade: string
  frequencia: 'MENSAL' | 'TRIMESTRAL' | 'ANUAL'
  meta_ano: number
  fonte_dados: string
  responsavel: string
}

export interface StrategicStagingRecord {
  sheetName: string
  rowNumber: number
  data: Record<string, any>
  status: 'VALID' | 'WARNING' | 'ERROR'
  messages: string[]
}

// ==========================================
// 4. KPIS COMERCIAIS (VENDEDOR & GERÊNCIA)
// ==========================================

export type CommercialKpiLevel = 'VENDEDOR' | 'GERENCIAL_DIRECAO' | 'AMBOS'
export type CommercialKpiCategory =
  | 'FATURAMENTO'
  | 'VOLUME'
  | 'MARGEM'
  | 'CLIENTES'
  | 'EFICIENCIA'
  | 'QUALIDADE'

export interface CommercialKpiDefinition {
  id: string
  codigo: string
  nome: string
  categoria: CommercialKpiCategory
  nivel: CommercialKpiLevel
  fonte: 'SAP_ECC' | 'QLIK_SENSE' | 'CRM_360' | 'TMS' | 'CONFIGURAVEL'
  unidade: 'R$' | 'TON' | '%' | 'UN' | 'DIAS' | 'SCORE'
  requires_configuration?: boolean
  formula_descricao: string
  meta_padrao?: number
  realizado_atual: number
  meta_atual: number
  periodo_anterior: number
  gap: number
  atingimento_pct: number
  tendencia: 'ALTA' | 'ESTAVEL' | 'BAIXA'
  forecast: number
  detalhes?: Record<string, any>
}
