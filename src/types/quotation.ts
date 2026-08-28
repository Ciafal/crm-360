export type QuotationStatus =
  | 'RASCUNHO'
  | 'EM_PREPARACAO'
  | 'AGUARDANDO_APROVACAO'
  | 'PRONTA_PARA_ENVIO'
  | 'ENVIADA_AO_CLIENTE'
  | 'AGUARDANDO_RETORNO'
  | 'NEGOCIACAO'
  | 'ACEITA'
  | 'CONVERSAO_SAP'
  | 'PEDIDO_IMPLANTADO'
  | 'PERDIDA'
  | 'CANCELADA'
  // Compatibilidade com registros legados
  | 'EM_ELABORACAO'
  | 'AGUARDANDO_CONFIRMACAO_ESTOQUE'
  | 'AJUSTE_SOLICITADO'
  | 'APROVADA_INTERNAMENTE'
  | 'EM_NEGOCIACAO'
  | 'EXPIRADA'
  | 'AGUARDANDO_IMPLANTACAO_SAP'
  | 'PROCESSANDO_SAP'
  | 'PEDIDO_SAP_IMPLANTADO'
  | 'ERRO_DE_IMPLANTACAO'
  | 'BLOQUEADO_NO_SAP'

export type ApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  // Compatibilidade
  | 'APROVADA_AUTOMATICAMENTE'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA_SUPERVISOR'
  | 'APROVADA_GERENCIA'
  | 'APROVADA_DIRETORIA'
  | 'AJUSTE_SOLICITADO'

export type StockSituation =
  | 'ESTOQUE_SUFICIENTE'
  | 'ESTOQUE_BAIXO'
  | 'SEM_ESTOQUE'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'CONFIRMACAO_NEGADA'
  | 'CONFIRMADO_PARCIAL'

export type PriceStatus = 'DENTRO_DA_REGRA' | 'EXCECAO_PRECO' | 'APROVADO'

export type ClientStatus =
  | 'NAO_ENVIADA'
  | 'ENVIADA'
  | 'VISUALIZADA'
  | 'EM_NEGOCIACAO'
  | 'ACEITA'
  | 'RECUSADA'

export type SapQueueStatus =
  | 'READY_FOR_SAP'
  | 'SAP_READING'
  | 'IMPLANTED'
  | 'BLOCKED'
  | 'ERROR'
  | 'RETRY'
  | 'CANCELLED'
  // Compatibilidade
  | 'PENDING'
  | 'SAP_PROCESSING'
  | 'SAP_CREATED'
  | 'SAP_WARNING'
  | 'SAP_ERROR'
  | 'SAP_BLOCKED'
  | 'RETRY_PENDING'

export type LossReason =
  | 'PRECO'
  | 'PRAZO'
  | 'FRETE'
  | 'ESTOQUE'
  | 'PRODUCAO'
  | 'CREDITO'
  | 'CONCORRENCIA'
  | 'CLIENTE_ADIOU'
  | 'SEM_RESPOSTA'
  | 'ESPECIFICACAO'
  | 'OUTRO'

export interface MaterialBatchInfo {
  batchNumber: string
  quantity: number
  weightTons: number
  storageLocation: string
}

export interface MaterialStockInfo {
  availableStockTons: number
  batchCount: number
  averageBatchWeightTons: number
  modeBatchWeightTons: number
  plant: string
  storageLocation: string
  lastUpdatedAt: string
  batches?: MaterialBatchInfo[]
}

export interface MaterialPlannedProduction {
  hasPlannedProduction: boolean
  plannedDate?: string
  plannedQuantityTons?: number
  productionLineCenter?: string
  lastUpdatedAt?: string
  sourceSystem: string // "SAP ECC PP / Planejamento Oficial"
}

export interface QuotationItem {
  id: string
  item_sequence: number
  material_code: string
  description: string
  family?: string
  dimension?: string
  quantity: number // em t
  unit: string // padrão 't'
  requested_date: string
  sap_price: number // Preço base SAP ECC (R$/t)
  proposed_price: number // Preço proposto pelo vendedor (R$/t)
  deviation_pct: number // Desvio %: ((proposed - sap)/sap)*100
  discount_pct?: number
  final_price: number
  total: number
  stock_available: number
  stock_situation: StockSituation
  stock_updated_at: string
  stock_confirmation_required: boolean
  stock_confirmed?: boolean
  stock_confirmed_qty?: number
  stock_confirmation_date?: string
  price_justification?: string
  price_reason?: string
  plant?: string
  storage_location?: string
  weight_per_unit?: number
  stock_details?: MaterialStockInfo
  planned_production?: MaterialPlannedProduction
}

export interface QuotationTimelineEvent {
  id?: string
  time: string
  date?: string
  title?: string
  description: string
  actor?: string
  badge?: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SAP'
}

export interface QuotationPricingSnapshot {
  base_list_price: number
  taxes_pct: number // ICMS + PIS + COFINS
  freight_component: number
  standard_margin_pct: number
  proposed_margin_pct: number
  payment_term_surcharge_pct: number
  raw_cost: number
  created_at: string
}

export interface QuoteVersion {
  version: number
  created_at: string
  created_by: string
  items: QuotationItem[]
  total_value: number
  total_tons: number
  payment_terms: string
  freight_type: 'CIF' | 'FOB'
  freight_value: number
  status: QuotationStatus
  notes?: string
  pdf_reference?: string
}

export interface QuotationApprovalAudit {
  requested_by: string
  requested_at: string
  rule_triggered: string // 'DESCONTO_ALCADA' | 'MARGEM_MINIMA' | 'PRAZO_ESPECIAL' | 'FRETE_BONIFICADO'
  discount_requested_pct: number
  approver_name?: string
  approver_level?: 'SUPERVISOR' | 'GERENCIA' | 'DIRETORIA'
  approved_at?: string
  rejection_reason?: string
  status: ApprovalStatus
}

export interface Quotation {
  id: string
  code: string
  version: number
  versions_history?: QuoteVersion[]
  customer_id: string
  customer_sap_code: string
  customer_name: string
  customer_cnpj?: string
  customer_city?: string
  customer_uf?: string
  customer_archetype?: string
  customer_abc?: 'A' | 'B' | 'C'
  opportunity_id?: string
  opportunity_title?: string
  contact_name: string
  contact_role?: string
  contact_email?: string
  contact_phone?: string
  ship_to_code: string
  ship_to_address?: string
  seller_id: string
  seller_name: string
  representative_name?: string
  issue_date: string
  valid_until: string
  payment_terms: string
  incoterm: string
  freight_type: 'CIF' | 'FOB'
  freight_value: number
  currency: 'BRL' | 'USD'
  sales_org: string
  distribution_channel: string
  division: string
  items: QuotationItem[]
  subtotal: number
  discount_total: number
  surcharge_total: number
  total_tons: number
  total_value: number
  probability_pct: number
  price_status: PriceStatus
  stock_status: StockSituation
  approval_status: ApprovalStatus
  approval_level_required: 'NENHUM' | 'SUPERVISOR' | 'GERENCIA' | 'DIRETORIA'
  approval_audit?: QuotationApprovalAudit
  approval_notes?: string
  approved_by?: string
  approved_at?: string
  client_status: ClientStatus
  client_acceptance_notes?: string
  client_accepted_at?: string
  client_accepted_source?: 'WHATSAPP' | 'EMAIL' | 'TELEFONE' | 'PORTAL'
  status: QuotationStatus
  notes?: string
  loss_reason?: LossReason
  loss_notes?: string
  last_contact_at?: string
  last_follow_up_at?: string
  next_action_due?: string
  next_action_description?: string
  stage_entered_at: string // ISO para cálculo de Aging
  sap_order_number?: string
  sap_processing_status?: string
  sap_integration_id?: string
  timeline: QuotationTimelineEvent[]
  pricing_snapshot?: QuotationPricingSnapshot
  created?: string
  updated?: string
}

export interface StockSnapshotRecord {
  id: string
  material_code: string
  plant: string
  storage_location: string
  batch?: string
  available_stock: number
  reserved_stock: number
  blocked_stock: number
  quality_stock: number
  unit: string
  snapshot_datetime: string
  source_job: string
  integration_status: string
}

export interface InventoryConfirmationRequest {
  id: string
  quotation_id: string
  quotation_code: string
  quotation_item_id: string
  customer_name: string
  material_code: string
  material_description: string
  requested_qty: number // t
  unit: string // 't'
  stock_snapshot_qty: number
  confirmed_qty?: number
  request_datetime: string
  sla_deadline: string // 48h SLA
  requested_by: string
  assigned_area: string // "PCP / WMS / Pátio"
  confirmed_by?: string
  confirmation_datetime?: string
  confirmation_status:
    | 'AGUARDANDO_ANALISE'
    | 'CONFIRMADO'
    | 'CONFIRMADO_PARCIAL'
    | 'NEGADO'
    | 'EM_ANALISE'
  expected_date?: string
  comment?: string
}

export type StockConfirmationRequest = InventoryConfirmationRequest

export interface QuoteOrderIntegration {
  id: string
  integration_id: string
  quote_id: string
  quotation_id?: string
  quotation_code: string
  quotation_version: number
  customer_id: string
  sap_customer_code: string
  customer_name?: string
  ship_to_code: string
  status: SapQueueStatus
  request_status?: SapQueueStatus
  payload_reference?: string
  requested_at: string
  created_at?: string
  created_by?: string
  processed_at?: string
  sap_order_number?: string
  sap_return_status?: string
  sap_processing_status?: string
  sap_return_code?: string
  sap_return_message?: string
  sap_error_code?: string
  sap_error_message?: string
  retry_count: number
  sales_org: string
  distribution_channel: string
  division: string
  payment_terms: string
  incoterm: string
  customer_po_number?: string
  quotation_total: number
  currency: string
  requested_delivery_date: string
  crm_reference: string
  sap_job_id?: string
  locked_for_processing: boolean
  locked_at?: string
  locked_by?: string
  items_payload: Array<{
    item_sequence: number
    material_code: string
    quantity: number
    unit: string
    requested_delivery_date: string
    plant: string
    storage_location: string
    crm_price_reference: number
    proposed_price: number
    approved_price: number
    quotation_item_id: string
  }>
}

export type SapOrderQueueItem = QuoteOrderIntegration

export interface SapOrderMessage {
  id: string
  integration_id: string
  quotation_id?: string
  message_type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'
  message_class: string
  message_number: string
  message_text: string
  source: string
  created_at: string
}

export interface QuotationCommunication {
  id: string
  quotation_id: string
  quotation_code?: string
  channel: 'WHATSAPP' | 'EMAIL'
  recipient: string
  recipient_name?: string
  message: string
  attached_pdf_name?: string
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  sent_at: string
  sent_by: string
  evidence_id?: string
  suggested_by_ia?: boolean
}
