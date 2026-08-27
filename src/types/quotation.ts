export type QuotationStatus =
  | 'RASCUNHO'
  | 'EM_ELABORACAO'
  | 'AGUARDANDO_CONFIRMACAO_ESTOQUE'
  | 'AGUARDANDO_APROVACAO'
  | 'AJUSTE_SOLICITADO'
  | 'APROVADA_INTERNAMENTE'
  | 'ENVIADA_AO_CLIENTE'
  | 'EM_NEGOCIACAO'
  | 'ACEITA'
  | 'PERDIDA'
  | 'EXPIRADA'
  | 'AGUARDANDO_IMPLANTACAO_SAP'
  | 'PROCESSANDO_SAP'
  | 'PEDIDO_SAP_IMPLANTADO'
  | 'ERRO_DE_IMPLANTACAO'
  | 'BLOQUEADO_NO_SAP'
  | 'CANCELADA'

export type ApprovalStatus =
  | 'APROVADA_AUTOMATICAMENTE'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA_SUPERVISOR'
  | 'APROVADA_GERENCIA'
  | 'APROVADA_DIRETORIA'
  | 'REJEITADA'
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
  | 'PENDING'
  | 'READY_FOR_SAP'
  | 'SAP_PROCESSING'
  | 'SAP_CREATED'
  | 'SAP_WARNING'
  | 'SAP_ERROR'
  | 'SAP_BLOCKED'
  | 'RETRY_PENDING'
  | 'CANCELLED'

export interface QuotationItem {
  id: string
  item_sequence: number
  material_code: string
  description: string
  family?: string
  dimension?: string
  quantity: number
  unit: string // 't' | 'KG' | 'PC' | 'BARRA'
  requested_date: string
  sap_price: number // Preço SAP (ex: R$ por Tonelada ou KG)
  proposed_price: number // Preço Proposto pelo Vendedor
  deviation_pct: number // Desvio % calculado: ((proposed - sap)/sap) * 100
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

export interface Quotation {
  id: string
  code: string
  version: number
  customer_id: string
  customer_sap_code: string
  customer_name: string
  customer_cnpj?: string
  contact_name: string
  contact_email?: string
  contact_phone?: string
  ship_to_code: string
  ship_to_address?: string
  seller_id: string
  seller_name: string
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
  price_status: PriceStatus
  stock_status: StockSituation
  approval_status: ApprovalStatus
  approval_level_required: 'NENHUM' | 'SUPERVISOR' | 'GERENCIA' | 'DIRETORIA'
  approval_notes?: string
  approved_by?: string
  approved_at?: string
  client_status: ClientStatus
  client_acceptance_notes?: string
  client_accepted_at?: string
  status: QuotationStatus
  notes?: string
  sap_order_number?: string
  sap_processing_status?: string
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

export interface StockConfirmationRequest {
  id: string
  quotation_id: string
  quotation_code: string
  quotation_item_id: string
  customer_name: string
  material_code: string
  material_description: string
  requested_qty: number
  unit: string
  stock_snapshot_qty: number
  confirmed_qty?: number
  request_datetime: string
  requested_by: string
  assigned_area: string
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

export interface SapOrderQueueItem {
  id: string
  integration_id: string
  quotation_id: string
  quotation_code: string
  quotation_version: number
  request_status: SapQueueStatus
  created_at?: string
  created_by?: string
  customer_sap_code: string
  customer_name?: string
  ship_to_code: string
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
  sap_order_number?: string
  sap_processing_status: string
  sap_return_code?: string
  sap_return_message?: string
  processed_at?: string
  sap_job_id?: string
  retry_count: number
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
  channel: 'WHATSAPP' | 'EMAIL'
  recipient: string
  recipient_name?: string
  message: string
  attached_pdf_name?: string
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  sent_at: string
  sent_by: string
}
