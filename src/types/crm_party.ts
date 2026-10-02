// src/types/crm_party.ts
// Tipagem completa do REGISTRO COMERCIAL ÚNICO DO CLIENTE - CIAFAL CRM 360º

export type CommercialStage =
  | 'LEAD'
  | 'LEAD_QUALIFICADO'
  | 'PROSPECT'
  | 'CADASTRO_EM_ANDAMENTO'
  | 'ANALISE_FINANCEIRA'
  | 'CADASTRO_SAP'
  | 'CLIENTE_SAP'
  | 'PRIMEIRA_COTACAO'
  | 'PRIMEIRO_PEDIDO'
  | 'PRIMEIRO_FATURAMENTO'
  | 'CLIENTE_ATIVO'
  | 'CLIENTE_INATIVO'
  | 'PERDIDO'

export type RegistrationStatus =
  | 'NAO_INICIADO'
  | 'FICHA_ENVIADA'
  | 'EM_PREENCHIMENTO'
  | 'DOCUMENTACAO_PENDENTE'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'REPROVADO'
  | 'CADASTRO_SAP_PENDENTE'
  | 'CADASTRO_SAP_CONCLUIDO'

export type CreditStatus =
  | 'NAO_SOLICITADO'
  | 'EM_ANALISE'
  | 'PENDENTE_DOCUMENTACAO'
  | 'APROVADO'
  | 'APROVADO_PARCIALMENTE'
  | 'PAGAMENTO_ANTECIPADO'
  | 'BLOQUEADO'
  | 'REPROVADO'
  | 'REVISAO_NECESSARIA'

export type BusinessOpportunityStatus =
  | 'SEM_OPORTUNIDADE'
  | 'OPORTUNIDADE_ABERTA'
  | 'COTACAO'
  | 'PEDIDO'
  | 'FATURADO'
  | 'ATIVO'
  | 'INATIVO'

export type UserRoleProfile =
  | 'Comercial'
  | 'Financeiro'
  | 'Fiscal'
  | 'Gestor Comercial'
  | 'Administrador'
  | 'Auditoria'

export interface CrmPartyContact {
  id: string
  crm_party_id: string
  nome: string
  cargo: string
  departamento: string
  funcao_classificacao:
    | 'Compras'
    | 'Financeiro'
    | 'Fiscal'
    | 'Logística'
    | 'Recebimento'
    | 'Qualidade'
    | 'Diretoria'
    | 'Comercial'
  telefone: string
  whatsapp: string
  email: string
  is_principal: boolean
  data_nascimento?: string
  observacoes?: string
}

export interface CrmPartyAddress {
  id: string
  crm_party_id: string
  tipo: 'SEDE' | 'COBRANCA' | 'ENTREGA'
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  codigo_sap_recebedor?: string
  restricoes_descarga?: string
  janela_recebimento?: string
  is_padrao: boolean
}

export interface CrmSapMapping {
  id: string
  crm_party_id: string
  sap_customer_id: string
  empresa_sap: string
  org_vendas: string
  canal_distribuicao: string
  setor_atividade: string
  centro_distribuicao: string
  condicao_pagamento: string
  esquema_cliente?: string
  bloqueio_ordem_venda?: string
  bloqueio_entrega?: string
  bloqueio_faturamento?: string
  status: 'ATIVO' | 'BLOQUEADO' | 'PENDENTE'
}

export interface LeadScoreHistoryItem {
  id: string
  data: string
  score: number // 0 a 100
  motivo: string
  variaveisConsideradas: string[]
  autor: string
}

export interface CrmDocumentItem {
  id: string
  crm_party_id: string
  onboarding_id: string
  tipo_documento:
    | 'CARTAO_CNPJ'
    | 'INSCRICAO_ESTADUAL'
    | 'CONTRATO_SOCIAL'
    | 'ALTERACOES_CONTRATUAIS'
    | 'COMPROVANTE_ENDERECO'
    | 'DOC_REPRESENTANTES'
    | 'PROCURACAO'
    | 'BALANCO_PATRIMONIAL'
    | 'DRE'
    | 'BALANCETE'
    | 'REFERENCIAS_BANCARIAS'
    | 'REFERENCIAS_COMERCIAIS'
    | 'OUTROS'
  nome_arquivo: string
  versao: number
  status: 'EM_ANALISE' | 'APROVADO' | 'REJEITADO' | 'PENDENTE'
  arquivo_url: string
  tamanho_bytes: number
  mimetype: string
  obrigatorio: boolean
  upload_por_usuario: string
  upload_origem: 'PORTAL_CLIENTE' | 'CRM_VENDEDOR' | 'FINANCEIRO'
  motivo_rejeicao?: string
  observacoes?: string
  validado_por?: string
  validado_em?: string
  created: string
}

export interface CrmOnboardingProcess {
  id: string
  crm_party_id: string
  protocolo: string // CAD-AAAA-NNNNN
  tipo_processo:
    | 'CADASTRO_INICIAL'
    | 'ALTERACAO_CADASTRAL'
    | 'INCLUSAO_ENDERECO'
    | 'ALTERACAO_SOCIETARIA'
    | 'REVISAO_FINANCEIRA'
  portal_token: string
  portal_url: string
  portal_token_expires_at: string
  portal_access_count: number
  portal_last_accessed_at?: string
  termos_aceitos: boolean
  termos_aceitos_em?: string
  etapa_atual:
    | 'PASSO1_EMPRESA'
    | 'PASSO2_ENDERECOS'
    | 'PASSO3_CONTATOS'
    | 'PASSO4_COMERCIAL'
    | 'PASSO5_DOCUMENTOS'
    | 'PASSO6_REVISAO'
    | 'PASSO7_CONCLUIDO'
  status:
    | 'AGUARDANDO_CLIENTE'
    | 'DOCUMENTACAO_INCOMPLETA'
    | 'AGUARDANDO_FINANCEIRO'
    | 'FINANCEIRO_ANALISANDO'
    | 'PENDENCIA_CLIENTE'
    | 'AGUARDANDO_SAP'
    | 'ERRO_SAP'
    | 'CONCLUIDO'
  progresso_pct: number
  documentos_obrigatorios_count: number
  documentos_enviados_count: number
  documentos_aprovados_count: number
  documentos_pendentes_count: number
  ai_validacao_status: 'OK' | 'ALERTAS_ENCONTRADOS' | 'PENDENTE'
  ai_validacao_alertas: string[]
  ai_validacao_score: number
  solicitante_id: string
  solicitante_nome: string
  analista_financeiro_id?: string
  analista_financeiro_nome?: string
  motivo_pendencia?: string
  justificativa_decisao?: string
  data_envio: string
  data_conclusao?: string
  sla_horas: number
  sla_estourado: boolean
}

export interface CrmCreditAnalysis {
  id: string
  crm_party_id: string
  status: CreditStatus
  limite_solicitado: number
  limite_aprovado: number
  limite_utilizado: number
  limite_disponivel: number
  titulos_vencidos_valor: number
  titulos_a_vencer_valor: number
  pedidos_em_carteira_valor: number
  exposicao_total: number
  dias_vencimento_medio: number
  condicao_pagamento_recomendada: string
  score_serasa: number
  parecer_ia: string
  ia_risco_nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
  decisao_humana_por?: string
  decisao_humana_em?: string
  justificativa?: string
  validade_limite?: string
}

export interface CrmSapIntegrationQueueItem {
  id: string
  crm_party_id: string
  onboarding_id: string
  operacao: 'CREATE_CUSTOMER' | 'UPDATE_CUSTOMER' | 'EXTEND_SALES_AREA' | 'BLOCK_CUSTOMER'
  payload_sap: Record<string, any>
  status:
    | 'PENDENTE'
    | 'ENVIADO'
    | 'PROCESSANDO'
    | 'PROCESSADO'
    | 'ERRO'
    | 'CORRIGIDO'
    | 'REPROCESSANDO'
  tentativas: number
  max_tentativas: number
  sap_customer_id?: string
  sap_return_message?: string
  sap_bapi_log?: string
  enviado_em?: string
  processado_em?: string
  erro_em?: string
}

export interface CrmTimeline360Event {
  id: string
  crm_party_id: string
  etapa_origem: CommercialStage | 'SISTEMA' | 'PORTAL'
  tipo_evento:
    | 'lead_criado'
    | 'qualificacao'
    | 'mudanca_estagio'
    | 'contato'
    | 'tarefa'
    | 'visita'
    | 'ficha_enviada'
    | 'ficha_preenchida'
    | 'doc_enviado'
    | 'doc_rejeitado'
    | 'doc_aprovado'
    | 'analise_financeira'
    | 'solicitacao_correcao'
    | 'cadastro_aprovado'
    | 'fila_sap'
    | 'sap_integrado'
    | 'credito_analisado'
    | 'credito_aprovado'
    | 'cotacao_criada'
    | 'pedido_gerado'
    | 'faturamento_concluido'
    | 'reclamacao'
    | 'reativacao'
    | 'transferencia_carteira'
  titulo: string
  descricao: string
  usuario_nome: string
  modulo_origem: string
  dados_contexto?: Record<string, any>
  valor?: number
  volume_tons?: number
  created: string
}

export interface CrmAuditLogItem {
  id: string
  crm_party_id: string
  entidade:
    | 'crm_parties'
    | 'crm_onboardings'
    | 'crm_documents'
    | 'crm_credit_analyses'
    | 'crm_sap_mappings'
  entidade_id: string
  campo_alterado: string
  valor_anterior: string
  valor_novo: string
  motivo_alteracao?: string
  usuario_id: string
  usuario_nome: string
  usuario_perfil: UserRoleProfile
  created: string
}

export interface CommercialCycleOpportunity {
  id: string
  crm_party_id: string
  codigo_oportunidade: string // Ex: OPP-2026-001
  titulo: string
  valor: number
  toneladas: number
  estagio: 'NOVA' | 'QUALIFICACAO' | 'COTACAO' | 'NEGOCIACAO' | 'GANHA' | 'PERDIDA'
  probabilidade: number
  produto_familia: string
  vendedor_nome: string
  motivo_perda?: string
  created: string
}

// REGISTRO MESTRE CRM PARTY 360º
export type CrmPartyRecord = CrmPartyMaster

export interface CrmPartyMaster {
  id: string
  crm_party_id: string // UUID imutável
  friendly_code: string // CRM-000182
  tipo_pessoa: 'PJ' | 'PF'
  razao_social: string
  nome_fantasia: string
  cnpj_cpf: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  cnae?: string
  regime_tributario?: string
  suframa?: string
  website?: string
  email: string
  telefone: string
  whatsapp: string
  cidade: string
  uf: string
  regiao: string
  segmento: string
  subsegmento?: string

  // Origem Comercial Imutável
  origem_comercial: string
  campanha_origem?: string
  vendedor_captador_id: string
  vendedor_captador_nome: string
  created_at: string

  // Vendedor e Equipe Atuais (Rastreável)
  vendedor_atual_id: string
  vendedor_atual_nome: string
  supervisor_id?: string
  supervisor_nome?: string
  regional?: string
  empresa_vinculada?: string

  // Grupo Econômico & Matriz/Filial
  grupo_economico_id?: string
  grupo_economico_nome?: string
  is_matriz: boolean
  matriz_party_id?: string

  // Dimensões Independentes
  commercial_stage: CommercialStage
  registration_status: RegistrationStatus
  credit_status: CreditStatus
  business_status: BusinessOpportunityStatus

  // Classificação e Prioridade
  classification: 'ESTRATEGICO' | 'CLIENTE_A' | 'CLIENTE_B' | 'CLIENTE_C' | 'PROSPECT' | 'EM_RISCO'
  priority_level: 'Prioridade 1' | 'Prioridade 2' | 'Prioridade 3' | 'Acompanhamento'

  // Qualificação & IA Score
  lead_score: number // 0 a 100
  lead_score_history: LeadScoreHistoryItem[]
  potencial_mensal_tons: number
  potencial_anual_tons: number
  potencial_mensal_valor: number
  produto_interesse: string
  aplicacao_produto: string
  concorrentes?: string
  frequencia_estimada_dias: number
  probabilidade_comercial: number
  previsao_primeira_compra?: string

  // Vínculo SAP ECC
  sap_customer_id?: string // Código SAP (ex: 100001 ou 00172893)
  sap_sync_status: 'NAO_INTEGRADO' | 'SINCRONIZADO' | 'PENDENTE' | 'ERRO'
  sap_sync_last_at?: string
  sap_mappings?: CrmSapMapping[]

  // Marco de Primeiro Negócio e Conversão
  data_primeira_cotacao?: string
  data_primeiro_pedido?: string
  data_primeiro_faturamento?: string
  valor_primeiro_faturamento?: number
  tons_primeiro_faturamento?: number
  tempo_lead_para_cliente_dias?: number
  tempo_cliente_para_pedido_dias?: number
  tempo_pedido_para_faturamento_dias?: number
  tempo_lead_para_faturamento_dias?: number

  // Histórico de Contatos, Endereços, Documentos, Processos
  contatos: CrmPartyContact[]
  enderecos: CrmPartyAddress[]
  onboardings: CrmOnboardingProcess[]
  documentos: CrmDocumentItem[]
  analise_credito?: CrmCreditAnalysis
  oportunidades_ciclos: CommercialCycleOpportunity[]
  timeline_360: CrmTimeline360Event[]
  audit_logs: CrmAuditLogItem[]

  // Gestão de Cobertura & Indicadores
  ultimo_contato_data?: string
  ultimo_contato_canal?: 'WhatsApp' | 'Telefone' | 'E-mail' | 'Visita' | 'Reunião'
  dias_sem_contato: number
  coberto: boolean
  cobertura_vencida_dias: number
  proxima_acao: string
  isc: number // 0 a 100
  otif: number // 0 a 100%

  // Histórico de perda / reativação
  motivo_perda?: string
  detalhe_perda?: string
  data_perda?: string
  is_reativado?: boolean
  data_reativacao?: string

  is_mock: boolean
}

// Filtros para o Funil Real de Aquisição
export interface FunilAquisicaoFilter {
  vendedorId?: string
  supervisorId?: string
  regional?: string
  segmento?: string
  produtoFamilia?: string
  origem?: string
  periodo?: string
}
