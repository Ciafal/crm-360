// src/services/crm_party_service.ts - Registro Comercial Único CRM 360º CIAFAL
import type {
  CrmPartyMaster,
  CommercialStage,
  RegistrationStatus,
  CreditStatus,
  BusinessOpportunityStatus,
  CrmPartyContact,
  CrmPartyAddress,
  CrmDocumentItem,
  CrmOnboardingProcess,
  CrmCreditAnalysis,
  CrmSapIntegrationQueueItem,
  CrmTimeline360Event,
  CrmAuditLogItem,
  LeadScoreHistoryItem,
  CommercialCycleOpportunity,
} from '@/types/crm_party'
import { mockCustomerManagementList } from '@/data/mockCustomerManagementData'
import { customerManagementService } from '@/services/customer_management_service'

const STORAGE_KEY_CRM_PARTIES = 'ciafal_crm_parties_v2'
const STORAGE_KEY_SAP_QUEUE = 'ciafal_crm_sap_queue_v2'

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'uuid-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now()
}

class CrmPartyService {
  private partiesCache: CrmPartyMaster[] | null = null

  // Inicializa dados com base nos clientes pré-existentes do mock + novos leads
  private initializeDefaultParties(): CrmPartyMaster[] {
    const existing = mockCustomerManagementList.map((item, index) => {
      const partyId = `party-legacy-${item.id}`
      const friendlyNum = String(index + 1).padStart(6, '0')

      const contacts: CrmPartyContact[] = [
        {
          id: `cont-${item.id}-01`,
          crm_party_id: partyId,
          nome: item.nomeFantasia.includes('Eng')
            ? 'Eng. Marcelo Queiroz'
            : 'Contato Principal Compras',
          cargo: 'Gerente de Suprimentos',
          departamento: 'Compras',
          funcao_classificacao: 'Compras',
          telefone: '(31) 3399-4000',
          whatsapp: '(31) 98765-4321',
          email:
            'compras@' +
            (item.razaoSocial
              .toLowerCase()
              .replace(/[^a-z]/g, '')
              .slice(0, 10) || 'empresa') +
            '.com.br',
          is_principal: true,
        },
      ]

      const enderecos: CrmPartyAddress[] = [
        {
          id: `addr-${item.id}-01`,
          crm_party_id: partyId,
          tipo: 'SEDE',
          logradouro: 'Av. Industrial CIAFAL',
          numero: '1500',
          bairro: 'Distrito Industrial',
          cidade: item.cidade,
          uf: item.uf,
          cep: '32000-000',
          codigo_sap_recebedor: item.codigo,
          is_padrao: true,
        },
      ]

      const documents: CrmDocumentItem[] = [
        {
          id: `doc-${item.id}-01`,
          crm_party_id: partyId,
          onboarding_id: `cad-legacy-${item.id}`,
          tipo_documento: 'CARTAO_CNPJ',
          nome_arquivo: `Cartao_CNPJ_${item.cnpj.replace(/[^0-9]/g, '')}.pdf`,
          versao: 1,
          status: 'APROVADO',
          arquivo_url: '/docs/cnpj.pdf',
          tamanho_bytes: 524288,
          mimetype: 'application/pdf',
          obrigatorio: true,
          upload_por_usuario: 'Sistema SAP Sinc',
          upload_origem: 'FINANCEIRO',
          validado_por: 'Auditoria Fiscal CIAFAL',
          validado_em: '2024-01-10',
          created: '2024-01-10',
        },
        {
          id: `doc-${item.id}-02`,
          crm_party_id: partyId,
          onboarding_id: `cad-legacy-${item.id}`,
          tipo_documento: 'CONTRATO_SOCIAL',
          nome_arquivo: 'Contrato_Social_Consolidado_V1.pdf',
          versao: 1,
          status: 'APROVADO',
          arquivo_url: '/docs/contrato.pdf',
          tamanho_bytes: 1450000,
          mimetype: 'application/pdf',
          obrigatorio: true,
          upload_por_usuario: 'Sistema SAP Sinc',
          upload_origem: 'FINANCEIRO',
          validado_por: 'Auditoria Fiscal CIAFAL',
          validado_em: '2024-01-10',
          created: '2024-01-10',
        },
      ]

      const timeline: CrmTimeline360Event[] = [
        {
          id: `time-${item.id}-01`,
          crm_party_id: partyId,
          etapa_origem: 'SISTEMA',
          tipo_evento: 'lead_criado',
          titulo: 'Registro Comercial Inicial (Origem: Base SAP Legada)',
          descricao: `Registro mestre originado do SAP ECC com código ${item.codigo}. Histórico preservado.`,
          usuario_nome: 'Sincronização SAP CIAFAL',
          modulo_origem: 'SAP_ECC',
          created: item.datasImportantes[0]?.data || '01/01/2024',
        },
        {
          id: `time-${item.id}-02`,
          crm_party_id: partyId,
          etapa_origem: 'CLIENTE_SAP',
          tipo_evento: 'sap_integrado',
          titulo: `Cliente SAP Ativo no ECC (${item.codigo})`,
          descricao: `Vinculado à Org. Vendas 1000, Canal 10, Matriz CIAFAL Betim/MG.`,
          usuario_nome: 'Interface RFC BAPI_CUSTOMER',
          modulo_origem: 'SAP_ECC',
          created: '15/01/2024',
        },
      ]

      const party: CrmPartyMaster = {
        id: partyId,
        crm_party_id: partyId,
        friendly_code: `CRM-${friendlyNum}`,
        tipo_pessoa: 'PJ',
        razao_social: item.razaoSocial,
        nome_fantasia: item.nomeFantasia,
        cnpj_cpf: item.cnpj,
        inscricao_estadual: '001.234.567.0099',
        cnae: '25.11-0-00 - Fabricação de estruturas metálicas',
        regime_tributario: 'Lucro Real',
        email: contacts[0].email,
        telefone: contacts[0].telefone,
        whatsapp: contacts[0].whatsapp,
        cidade: item.cidade,
        uf: item.uf,
        regiao: item.regiao,
        segmento: item.segmento,
        subsegmento: item.subsegmento,
        origem_comercial:
          item.classificacao === 'PROSPECT' ? 'Prospecção Ativa Vendedor' : 'SAP / BASE LEGADA',
        campanha_origem: 'Aquisição Q1 CIAFAL',
        vendedor_captador_id: item.vendedorId,
        vendedor_captador_nome: item.vendedorNome,
        created_at: '2024-01-01',
        vendedor_atual_id: item.vendedorId,
        vendedor_atual_nome: item.vendedorNome,
        supervisor_id: item.supervisorId,
        supervisor_nome: item.supervisorNome,
        regional: item.regional,
        empresa_vinculada: item.empresa,
        grupo_economico_nome: item.nomeFantasia.split(' ')[0] + ' Grupo',
        is_matriz: true,
        commercial_stage: item.classificacao === 'PROSPECT' ? 'PROSPECT' : 'CLIENTE_ATIVO',
        registration_status:
          item.classificacao === 'PROSPECT' ? 'FICHA_ENVIADA' : 'CADASTRO_SAP_CONCLUIDO',
        credit_status: item.classificacao === 'PROSPECT' ? 'EM_ANALISE' : 'APROVADO',
        business_status: item.classificacao === 'PROSPECT' ? 'OPORTUNIDADE_ABERTA' : 'ATIVO',
        classification: item.classificacao,
        priority_level: item.prioridadeCarteira,
        lead_score:
          item.classificacao === 'ESTRATEGICO' ? 95 : item.classificacao === 'CLIENTE_A' ? 84 : 65,
        lead_score_history: [
          {
            id: 'lsh-01',
            data: '01/01/2024',
            score: 72,
            motivo: 'Captação inicial e identificação de demanda',
            variaveisConsideradas: ['Segmento Industrial', 'Volume > 15t/mês'],
            autor: 'IA Consultor CIAFAL',
          },
          {
            id: 'lsh-02',
            data: '15/01/2024',
            score: item.classificacao === 'ESTRATEGICO' ? 95 : 84,
            motivo: 'Qualificação aprovada com faturamento recorrente',
            variaveisConsideradas: [
              'Score Serasa Alto',
              'Pontualidade de Pagamento',
              'Consumo Mensal',
            ],
            autor: 'IA Consultor CIAFAL',
          },
        ],
        potencial_mensal_tons: item.toneladasMes || 20,
        potencial_anual_tons: item.toneladas12m || 240,
        potencial_mensal_valor: item.faturamentoMes || 150000,
        produto_interesse: item.produtosSugeridos[0]?.descricao || 'Perfis e Vigas',
        aplicacao_produto: 'Construção Metálica e Caldeiraria',
        frequencia_estimada_dias: item.frequenciaEsperadaDias,
        probabilidade_comercial: 85,
        sap_customer_id: item.codigo,
        sap_sync_status: 'SINCRONIZADO',
        sap_sync_last_at: '2024-10-14 08:30',
        sap_mappings: [
          {
            id: `map-${item.id}`,
            crm_party_id: partyId,
            sap_customer_id: item.codigo,
            empresa_sap: '1000',
            org_vendas: '1000',
            canal_distribuicao: '10',
            setor_atividade: '00',
            centro_distribuicao: '1010',
            condicao_pagamento: '30/60 DDL (Boleto)',
            status: 'ATIVO',
          },
        ],
        data_primeira_cotacao: '2024-01-20',
        data_primeiro_pedido: '2024-01-25',
        data_primeiro_faturamento: '2024-01-28',
        valor_primeiro_faturamento: 85000,
        tons_primeiro_faturamento: 12.5,
        tempo_lead_para_cliente_dias: 14,
        tempo_cliente_para_pedido_dias: 5,
        tempo_pedido_para_faturamento_dias: 3,
        tempo_lead_para_faturamento_dias: 22,
        contatos: contacts,
        enderecos,
        onboardings: [
          {
            id: `cad-legacy-${item.id}`,
            crm_party_id: partyId,
            protocolo: `CAD-2024-${String(1000 + index)}`,
            tipo_processo: 'CADASTRO_INICIAL',
            portal_token: `tok-${partyId}`,
            portal_url: `https://portal.ciafal.com.br/onboarding?token=tok-${partyId}`,
            portal_token_expires_at: '2027-12-31',
            portal_access_count: 3,
            portal_last_accessed_at: '2024-01-08 14:20',
            termos_aceitos: true,
            termos_aceitos_em: '2024-01-08 14:22',
            etapa_atual: 'PASSO7_CONCLUIDO',
            status: 'CONCLUIDO',
            progresso_pct: 100,
            documentos_obrigatorios_count: 2,
            documentos_enviados_count: 2,
            documentos_aprovados_count: 2,
            documentos_pendentes_count: 0,
            ai_validacao_status: 'OK',
            ai_validacao_alertas: [],
            ai_validacao_score: 98,
            solicitante_id: item.vendedorId,
            solicitante_nome: item.vendedorNome,
            analista_financeiro_id: 'fin-01',
            analista_financeiro_nome: 'Marisa Alencar (Crédito & Cadastro)',
            data_envio: '2024-01-08',
            data_conclusao: '2024-01-10',
            sla_horas: 48,
            sla_estourado: false,
          },
        ],
        documentos: documents,
        analise_credito: {
          id: `cred-${item.id}`,
          crm_party_id: partyId,
          status: 'APROVADO',
          limite_solicitado: 350000,
          limite_aprovado: 300000,
          limite_utilizado: 110000,
          limite_disponivel: 190000,
          titulos_vencidos_valor: 0,
          titulos_a_vencer_valor: 65000,
          pedidos_em_carteira_valor: 45000,
          exposicao_total: 110000,
          dias_vencimento_medio: 28,
          condicao_pagamento_recomendada: '30/45 DDL',
          score_serasa: 880,
          parecer_ia:
            'Fluxo financeiro saudável, pontualidade exemplar e baixo endividamento bancário.',
          ia_risco_nivel: 'BAIXO',
          decisao_humana_por: 'Marisa Alencar (Gerente de Crédito)',
          decisao_humana_em: '2024-01-10',
          justificativa: 'Comprovantes idôneos e histórico positivo no mercado siderúrgico.',
          validade_limite: '2025-01-10',
        },
        oportunidades_ciclos: [
          {
            id: `opp-cyc-${item.id}`,
            crm_party_id: partyId,
            codigo_oportunidade: `OPP-2024-${String(index + 101)}`,
            titulo: `Fornecimento Trimestral - ${item.segmento}`,
            valor: item.faturamentoMes ? item.faturamentoMes * 3 : 250000,
            toneladas: item.toneladasMes ? item.toneladasMes * 3 : 35,
            estagio: 'GANHA',
            probabilidade: 100,
            produto_familia: item.produtosSugeridos[0]?.familia || 'Perfis Siderúrgicos',
            vendedor_nome: item.vendedorNome,
            created: '2024-01-15',
          },
        ],
        timeline_360: timeline,
        audit_logs: [
          {
            id: `aud-${item.id}-01`,
            crm_party_id: partyId,
            entidade: 'crm_parties',
            entidade_id: partyId,
            campo_alterado: 'commercial_stage',
            valor_anterior: 'CADASTRO_SAP',
            valor_novo: 'CLIENTE_SAP',
            motivo_alteracao: 'Retorno bem-sucedido da BAPI de criação SAP ECC',
            usuario_id: 'sys-sap',
            usuario_nome: 'Sincronizador SAP',
            usuario_perfil: 'Administrador',
            created: '2024-01-15 10:00:00',
          },
        ],
        ultimo_contato_data: item.ultimoContatoData,
        ultimo_contato_canal: (item.ultimoContatoCanal as any) || 'WhatsApp',
        dias_sem_contato: item.diasSemContato,
        coberto: item.coberto,
        cobertura_vencida_dias: item.coberturaVencidaDias,
        proxima_acao: item.proximaAcao,
        isc: item.isc,
        otif: item.otif,
        is_mock: true,
      }

      return party
    })

    // Adiciona 2 Leads recentes para fluxo inicial
    const newLead1: CrmPartyMaster = {
      id: 'party-lead-001',
      crm_party_id: 'party-lead-001',
      friendly_code: 'CRM-000182',
      tipo_pessoa: 'PJ',
      razao_social: 'Indústria Metalúrgica Triângulo Sul Eireli',
      nome_fantasia: 'Triângulo Sul Metalurgia',
      cnpj_cpf: '45.890.123/0001-90',
      email: 'roberto@triangulosul.com.br',
      telefone: '(35) 3422-1000',
      whatsapp: '(35) 99888-1122',
      cidade: 'Pouso Alegre',
      uf: 'MG',
      regiao: 'Sul de Minas',
      segmento: 'Indústria',
      subsegmento: 'Implementos Agrícolas',
      origem_comercial: 'Feira Agrishow 2024',
      campanha_origem: 'Agrishow Sul de Minas',
      vendedor_captador_id: 'qas-vendedor_teste',
      vendedor_captador_nome: 'Carlos Mendonça',
      created_at: '2024-10-10',
      vendedor_atual_id: 'qas-vendedor_teste',
      vendedor_atual_nome: 'Carlos Mendonça',
      regional: 'Minas Gerais Sul',
      empresa_vinculada: 'CIAFAL Matriz',
      is_matriz: true,
      commercial_stage: 'LEAD',
      registration_status: 'NAO_INICIADO',
      credit_status: 'NAO_SOLICITADO',
      business_status: 'SEM_OPORTUNIDADE',
      classification: 'PROSPECT',
      priority_level: 'Prioridade 1',
      lead_score: 82,
      lead_score_history: [
        {
          id: 'lsh-lead-1',
          data: '10/10/2024',
          score: 82,
          motivo: 'Captação presencial com volume potencial de 30t/mês em perfis e chapas',
          variaveisConsideradas: ['Agronegócio em alta', 'Volume > 25t', 'Contato com Diretor'],
          autor: 'Carlos Mendonça',
        },
      ],
      potencial_mensal_tons: 30.0,
      potencial_anual_tons: 360.0,
      potencial_mensal_valor: 195000,
      produto_interesse: 'Chapas Grossas A36 e Tubos Estruturais',
      aplicacao_produto: 'Chassis de carretas e caçambas agrícolas',
      frequencia_estimada_dias: 15,
      probabilidade_comercial: 70,
      previsao_primeira_compra: 'Novembro/2024',
      sap_sync_status: 'NAO_INTEGRADO',
      contatos: [
        {
          id: 'cnt-lead-1',
          crm_party_id: 'party-lead-001',
          nome: 'Roberto Silveira',
          cargo: 'Sócio e Diretor Industrial',
          departamento: 'Diretoria',
          funcao_classificacao: 'Diretoria',
          telefone: '(35) 3422-1000',
          whatsapp: '(35) 99888-1122',
          email: 'roberto@triangulosul.com.br',
          is_principal: true,
        },
      ],
      enderecos: [
        {
          id: 'addr-lead-1',
          crm_party_id: 'party-lead-001',
          tipo: 'SEDE',
          logradouro: 'Rodovia Fernão Dias, km 850',
          numero: 'S/N',
          bairro: 'Zona Rural',
          cidade: 'Pouso Alegre',
          uf: 'MG',
          cep: '37550-000',
          is_padrao: true,
        },
      ],
      onboardings: [],
      documentos: [],
      oportunidades_ciclos: [],
      timeline_360: [
        {
          id: 'time-lead-1',
          crm_party_id: 'party-lead-001',
          etapa_origem: 'LEAD',
          tipo_evento: 'lead_criado',
          titulo: 'Lead Cadastrado na Feira Agrishow',
          descricao: 'Empresa identificada com alto consumo de chapas e tubos para colheita.',
          usuario_nome: 'Carlos Mendonça',
          modulo_origem: 'CRM_LEAD_FORM',
          created: '10/10/2024',
        },
      ],
      audit_logs: [
        {
          id: 'aud-lead-1',
          crm_party_id: 'party-lead-001',
          entidade: 'crm_parties',
          entidade_id: 'party-lead-001',
          campo_alterado: 'criacao',
          valor_anterior: '',
          valor_novo: 'LEAD_CRIADO',
          motivo_alteracao: 'Cadastro simples de Lead',
          usuario_id: 'qas-vendedor_teste',
          usuario_nome: 'Carlos Mendonça',
          usuario_perfil: 'Comercial',
          created: '2024-10-10 09:00:00',
        },
      ],
      dias_sem_contato: 2,
      coberto: true,
      cobertura_vencida_dias: 0,
      proxima_acao: 'Agendar qualificação técnica e enviar catálogo de perfis',
      isc: 100,
      otif: 100,
      is_mock: true,
    }

    const newLead2: CrmPartyMaster = {
      id: 'party-lead-002',
      crm_party_id: 'party-lead-002',
      friendly_code: 'CRM-000183',
      tipo_pessoa: 'PJ',
      razao_social: 'Serralheria & Coberturas Metálicas Aliança',
      nome_fantasia: 'Aliança Coberturas',
      cnpj_cpf: '', // Lead sem CNPJ inicial
      email: 'aliancacoberturas@gmail.com',
      telefone: '(31) 3351-8899',
      whatsapp: '(31) 99222-3344',
      cidade: 'Contagem',
      uf: 'MG',
      regiao: 'Grande BH',
      segmento: 'Revenda & Serralheria',
      subsegmento: 'Estruturas Leves',
      origem_comercial: 'Indicação de Cliente',
      vendedor_captador_id: 'qas-vendedor_teste',
      vendedor_captador_nome: 'Carlos Mendonça',
      created_at: '2024-10-12',
      vendedor_atual_id: 'qas-vendedor_teste',
      vendedor_atual_nome: 'Carlos Mendonça',
      regional: 'Minas Gerais Centro',
      empresa_vinculada: 'CIAFAL Matriz',
      is_matriz: true,
      commercial_stage: 'LEAD',
      registration_status: 'NAO_INICIADO',
      credit_status: 'NAO_SOLICITADO',
      business_status: 'SEM_OPORTUNIDADE',
      classification: 'PROSPECT',
      priority_level: 'Prioridade 2',
      lead_score: 58,
      lead_score_history: [
        {
          id: 'lsh-lead-2',
          data: '12/10/2024',
          score: 58,
          motivo: 'Captação inicial sem CNPJ formalizado no primeiro contato',
          variaveisConsideradas: ['Serralheria Regional', 'Volume inicial 8t/mês'],
          autor: 'Carlos Mendonça',
        },
      ],
      potencial_mensal_tons: 8.0,
      potencial_anual_tons: 96.0,
      potencial_mensal_valor: 55000,
      produto_interesse: 'Tubos Metalon e Telhas Trapezoidais',
      aplicacao_produto: 'Coberturas comerciais e mezaninos',
      frequencia_estimada_dias: 20,
      probabilidade_comercial: 50,
      previsao_primeira_compra: 'Dezembro/2024',
      sap_sync_status: 'NAO_INTEGRADO',
      contatos: [
        {
          id: 'cnt-lead-2',
          crm_party_id: 'party-lead-002',
          nome: 'Cláudio Ferreira',
          cargo: 'Proprietário',
          departamento: 'Comercial',
          funcao_classificacao: 'Comercial',
          telefone: '(31) 3351-8899',
          whatsapp: '(31) 99222-3344',
          email: 'aliancacoberturas@gmail.com',
          is_principal: true,
        },
      ],
      enderecos: [
        {
          id: 'addr-lead-2',
          crm_party_id: 'party-lead-002',
          tipo: 'SEDE',
          logradouro: 'Rua das Indústrias',
          numero: '320',
          bairro: 'Eldorado',
          cidade: 'Contagem',
          uf: 'MG',
          cep: '32310-000',
          is_padrao: true,
        },
      ],
      onboardings: [],
      documentos: [],
      oportunidades_ciclos: [],
      timeline_360: [
        {
          id: 'time-lead-2',
          crm_party_id: 'party-lead-002',
          etapa_origem: 'LEAD',
          tipo_evento: 'lead_criado',
          titulo: 'Lead Cadastrado (Sem CNPJ Inicial)',
          descricao:
            'Contato obtido via indicação. CNPJ pendente para inclusão posterior com deduplicação.',
          usuario_nome: 'Carlos Mendonça',
          modulo_origem: 'CRM_LEAD_FORM',
          created: '12/10/2024',
        },
      ],
      audit_logs: [],
      dias_sem_contato: 1,
      coberto: true,
      cobertura_vencida_dias: 0,
      proxima_acao: 'Solicitar CNPJ para verificação de crédito e cadastro',
      isc: 100,
      otif: 100,
      is_mock: true,
    }

    return [...existing, newLead1, newLead2]
  }

  public getParties(): CrmPartyMaster[] {
    if (this.partiesCache) return this.partiesCache
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CRM_PARTIES)
      if (stored) {
        this.partiesCache = JSON.parse(stored)
        return this.partiesCache!
      }
    } catch {
      // fallback
    }

    const initial = this.initializeDefaultParties()
    this.saveParties(initial)
    return initial
  }

  public saveParties(parties: CrmPartyMaster[]): void {
    this.partiesCache = parties
    try {
      localStorage.setItem(STORAGE_KEY_CRM_PARTIES, JSON.stringify(parties))
    } catch {
      // silent
    }
  }

  public getPartyById(crmPartyId: string): CrmPartyMaster | undefined {
    return this.getParties().find((p) => p.crm_party_id === crmPartyId || p.id === crmPartyId)
  }

  public getPartyBySapCode(sapCode: string): CrmPartyMaster | undefined {
    return this.getParties().find((p) => p.sap_customer_id === sapCode)
  }

  // Deduplicação inteligente cruzada (CRM + SAP)
  public checkDuplicates(params: {
    cnpjCpf?: string
    razaoSocial?: string
    nomeFantasia?: string
    telefone?: string
    email?: string
    currentPartyId?: string
  }): {
    hasDuplicate: boolean
    matchedParty?: CrmPartyMaster
    reason?: string
    details?: {
      empresa: string
      cnpj: string
      codigoSap?: string
      vendedor: string
      situacao: string
      ultimaCompra?: string
      crmPartyId: string
    }
  } {
    const parties = this.getParties().filter((p) => p.crm_party_id !== params.currentPartyId)

    const cleanCnpj = (v?: string) => (v || '').replace(/[^0-9]/g, '')
    const targetCnpj = cleanCnpj(params.cnpjCpf)

    if (targetCnpj.length >= 11) {
      const match = parties.find((p) => cleanCnpj(p.cnpj_cpf) === targetCnpj)
      if (match) {
        return {
          hasDuplicate: true,
          matchedParty: match,
          reason: `CNPJ/CPF ${params.cnpjCpf} já está cadastrado no registro mestre ${match.friendly_code} (${match.razao_social})`,
          details: {
            empresa: match.razao_social,
            cnpj: match.cnpj_cpf,
            codigoSap: match.sap_customer_id,
            vendedor: match.vendedor_atual_nome,
            situacao: match.commercial_stage,
            ultimaCompra: match.data_primeiro_faturamento || 'Sem compras',
            crmPartyId: match.crm_party_id,
          },
        }
      }
    }

    if (params.email && params.email.includes('@')) {
      const match = parties.find(
        (p) =>
          p.email.toLowerCase() === params.email!.toLowerCase() ||
          p.contatos.some((c) => c.email.toLowerCase() === params.email!.toLowerCase()),
      )
      if (match) {
        return {
          hasDuplicate: true,
          matchedParty: match,
          reason: `E-mail ${params.email} já vinculado à empresa ${match.razao_social}`,
          details: {
            empresa: match.razao_social,
            cnpj: match.cnpj_cpf,
            codigoSap: match.sap_customer_id,
            vendedor: match.vendedor_atual_nome,
            situacao: match.commercial_stage,
            crmPartyId: match.crm_party_id,
          },
        }
      }
    }

    if (params.razaoSocial && params.razaoSocial.length > 5) {
      const match = parties.find(
        (p) =>
          p.razao_social.toLowerCase().includes(params.razaoSocial!.toLowerCase()) ||
          params.razaoSocial!.toLowerCase().includes(p.razao_social.toLowerCase()),
      )
      if (match) {
        return {
          hasDuplicate: true,
          matchedParty: match,
          reason: `Razão Social muito similar à empresa existente "${match.razao_social}" (${match.friendly_code})`,
          details: {
            empresa: match.razao_social,
            cnpj: match.cnpj_cpf,
            codigoSap: match.sap_customer_id,
            vendedor: match.vendedor_atual_nome,
            situacao: match.commercial_stage,
            crmPartyId: match.crm_party_id,
          },
        }
      }
    }

    return { hasDuplicate: false }
  }

  // 1. CADASTRAR NOVO LEAD COMERCIAL (Simples, sem burocracia, gera UUID e friendly_code)
  public createLead(data: {
    razaoSocial: string
    nomeFantasia?: string
    cnpjCpf?: string
    nomeContato: string
    whatsapp: string
    telefone?: string
    email?: string
    cidade: string
    uf: string
    segmento: string
    produtoInteresse: string
    aplicacao?: string
    potencialMensalTons: number
    vendedorNome?: string
    origem?: string
    observacao?: string
  }): CrmPartyMaster {
    const parties = this.getParties()
    const nextNum = parties.length + 184
    const friendlyCode = `CRM-${String(nextNum).padStart(6, '0')}`
    const partyId = generateUuid()
    const today = new Date().toLocaleDateString('pt-BR')
    const nowIso = new Date().toISOString()

    const newContact: CrmPartyContact = {
      id: generateUuid(),
      crm_party_id: partyId,
      nome: data.nomeContato,
      cargo: 'Contato Principal',
      departamento: 'Comercial',
      funcao_classificacao: 'Compras',
      telefone: data.telefone || data.whatsapp,
      whatsapp: data.whatsapp,
      email: data.email || '',
      is_principal: true,
      observacoes: data.observacao,
    }

    const newAddress: CrmPartyAddress = {
      id: generateUuid(),
      crm_party_id: partyId,
      tipo: 'SEDE',
      logradouro: 'Endereço Comercial',
      numero: 'S/N',
      bairro: 'Centro',
      cidade: data.cidade,
      uf: data.uf,
      cep: '00000-000',
      is_padrao: true,
    }

    const newParty: CrmPartyMaster = {
      id: partyId,
      crm_party_id: partyId,
      friendly_code: friendlyCode,
      tipo_pessoa: data.cnpjCpf && data.cnpjCpf.length > 14 ? 'PJ' : 'PJ',
      razao_social: data.razaoSocial,
      nome_fantasia: data.nomeFantasia || data.razaoSocial.split(' ')[0],
      cnpj_cpf: data.cnpjCpf || '',
      email: data.email || '',
      telefone: data.telefone || '',
      whatsapp: data.whatsapp,
      cidade: data.cidade,
      uf: data.uf,
      regiao: data.uf === 'MG' ? 'Minas Gerais Centro' : 'Sudeste',
      segmento: data.segmento,
      subsegmento: 'Geral',
      origem_comercial: data.origem || 'Prospecção Ativa',
      vendedor_captador_id: 'qas-vendedor_teste',
      vendedor_captador_nome: data.vendedorNome || 'Carlos Mendonça',
      created_at: nowIso.slice(0, 10),
      vendedor_atual_id: 'qas-vendedor_teste',
      vendedor_atual_nome: data.vendedorNome || 'Carlos Mendonça',
      regional: 'Minas Gerais Centro',
      empresa_vinculada: 'CIAFAL Matriz',
      is_matriz: true,
      commercial_stage: 'LEAD',
      registration_status: 'NAO_INICIADO',
      credit_status: 'NAO_SOLICITADO',
      business_status: 'SEM_OPORTUNIDADE',
      classification: 'PROSPECT',
      priority_level: data.potencialMensalTons >= 20 ? 'Prioridade 1' : 'Prioridade 2',
      lead_score: data.potencialMensalTons >= 20 ? 80 : 65,
      lead_score_history: [
        {
          id: generateUuid(),
          data: today,
          score: data.potencialMensalTons >= 20 ? 80 : 65,
          motivo: `Cadastro inicial de Lead Comercial com ${data.potencialMensalTons} t/mês`,
          variaveisConsideradas: ['Volume Estimado', 'Segmento', 'Canal Direto'],
          autor: data.vendedorNome || 'Carlos Mendonça',
        },
      ],
      potencial_mensal_tons: data.potencialMensalTons,
      potencial_anual_tons: data.potencialMensalTons * 12,
      potencial_mensal_valor: data.potencialMensalTons * 6500,
      produto_interesse: data.produtoInteresse,
      aplicacao_produto: data.aplicacao || 'Uso fabril/estrutural',
      frequencia_estimada_dias: 20,
      probabilidade_comercial: 50,
      sap_sync_status: 'NAO_INTEGRADO',
      contatos: [newContact],
      enderecos: [newAddress],
      onboardings: [],
      documentos: [],
      oportunidades_ciclos: [],
      timeline_360: [
        {
          id: generateUuid(),
          crm_party_id: partyId,
          etapa_origem: 'LEAD',
          tipo_evento: 'lead_criado',
          titulo: `Lead ${friendlyCode} Criado no CRM`,
          descricao: `Origem: ${data.origem || 'Prospecção'}. Interesse: ${data.produtoInteresse} (${data.potencialMensalTons} t/mês).`,
          usuario_nome: data.vendedorNome || 'Carlos Mendonça',
          modulo_origem: 'CRM_PARTY_CORE',
          created: today,
        },
      ],
      audit_logs: [
        {
          id: generateUuid(),
          crm_party_id: partyId,
          entidade: 'crm_parties',
          entidade_id: partyId,
          campo_alterado: 'criacao_mestre',
          valor_anterior: '',
          valor_novo: friendlyCode,
          motivo_alteracao: 'Criação do Registro Comercial Único',
          usuario_id: 'qas-vendedor_teste',
          usuario_nome: data.vendedorNome || 'Carlos Mendonça',
          usuario_perfil: 'Comercial',
          created: nowIso,
        },
      ],
      dias_sem_contato: 0,
      coberto: true,
      cobertura_vencida_dias: 0,
      proxima_acao: 'Qualificar lead e apresentar soluções técnicas CIAFAL',
      isc: 100,
      otif: 100,
      is_mock: true,
    }

    parties.unshift(newParty)
    this.saveParties(parties)
    return newParty
  }

  // 2. QUALIFICAR LEAD COM IA SCORE HISTÓRICO (Mantém mesmo crm_party_id)
  public qualifyLead(
    crmPartyId: string,
    qualification: {
      potencialMensalTons: number
      potencialAnualTons: number
      produtos: string
      aplicacoes: string
      frequenciaEstimadaDias: number
      concorrentes?: string
      probabilidadeComercial: number
      previsaoPrimeiraCompra?: string
      userName?: string
    },
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const today = new Date().toLocaleDateString('pt-BR')

    // Cálculo do Lead Score IA 0-100 (Não altera crédito)
    let computedScore = 50
    if (qualification.potencialMensalTons >= 30) computedScore += 25
    else if (qualification.potencialMensalTons >= 15) computedScore += 15

    if (qualification.probabilidadeComercial >= 75) computedScore += 15
    else if (qualification.probabilidadeComercial >= 50) computedScore += 10

    if (p.cnpj_cpf) computedScore += 10

    computedScore = Math.min(100, computedScore)

    const scoreEntry: LeadScoreHistoryItem = {
      id: generateUuid(),
      data: today,
      score: computedScore,
      motivo: `Qualificação comercial: potencial ${qualification.potencialMensalTons} t/mês (${qualification.probabilidadeComercial}% prob)`,
      variaveisConsideradas: [
        `Volume ${qualification.potencialMensalTons} t`,
        `Probabilidade ${qualification.probabilidadeComercial}%`,
        `Frequência ${qualification.frequenciaEstimadaDias} dias`,
      ],
      autor: qualification.userName || 'IA Consultor CIAFAL',
    }

    p.lead_score = computedScore
    p.lead_score_history = [...p.lead_score_history, scoreEntry]
    p.potencial_mensal_tons = qualification.potencialMensalTons
    p.potencial_anual_tons = qualification.potencialAnualTons
    p.potencial_mensal_valor = qualification.potencialMensalTons * 6500
    p.produto_interesse = qualification.produtos
    p.aplicacao_produto = qualification.aplicacoes
    p.frequencia_estimada_dias = qualification.frequenciaEstimadaDias
    p.concorrentes = qualification.concorrentes || p.concorrentes
    p.probabilidade_comercial = qualification.probabilidadeComercial
    p.previsao_primeira_compra = qualification.previsaoPrimeiraCompra

    // Transição de estágio dentro do MESMO REGISTRO
    p.commercial_stage = 'LEAD_QUALIFICADO'

    p.timeline_360.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      etapa_origem: 'LEAD_QUALIFICADO',
      tipo_evento: 'qualificacao',
      titulo: `Lead Qualificado com Score ${computedScore}/100`,
      descricao: `Potencial: ${qualification.potencialMensalTons} t/mês. Produtos: ${qualification.produtos}. Probabilidade: ${qualification.probabilidadeComercial}%.`,
      usuario_nome: qualification.userName || 'Carlos Mendonça',
      modulo_origem: 'CRM_QUALIFICACAO',
      created: today,
    })

    p.audit_logs.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      entidade: 'crm_parties',
      entidade_id: p.crm_party_id,
      campo_alterado: 'commercial_stage',
      valor_anterior: 'LEAD',
      valor_novo: 'LEAD_QUALIFICADO',
      motivo_alteracao: 'Qualificação Comercial com IA Score',
      usuario_id: 'qas-vendedor_teste',
      usuario_nome: qualification.userName || 'Carlos Mendonça',
      usuario_perfil: 'Comercial',
      created: new Date().toISOString(),
    })

    parties[idx] = p
    this.saveParties(parties)
    return p
  }

  // 3. INICIAR CADASTRO DO CLIENTE (LEAD_QUALIFICADO → PROSPECT, cria CAD-AAAA-NNNNN)
  public initiateOnboarding(
    crmPartyId: string,
    options?: {
      tipoProcesso?: CrmOnboardingProcess['tipo_processo']
      solicitanteNome?: string
    },
  ): { party: CrmPartyMaster; onboarding: CrmOnboardingProcess } {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const currentYear = new Date().getFullYear()
    const randNum = Math.floor(1000 + Math.random() * 9000)
    const protocolo = `CAD-${currentYear}-${randNum}`
    const token = generateUuid()
    const today = new Date().toLocaleDateString('pt-BR')

    const onboarding: CrmOnboardingProcess = {
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      protocolo,
      tipo_processo: options?.tipoProcesso || 'CADASTRO_INICIAL',
      portal_token: token,
      portal_url: `https://portal.ciafal.com.br/onboarding?token=${token}&proto=${protocolo}`,
      portal_token_expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
      portal_access_count: 0,
      termos_aceitos: false,
      etapa_atual: 'PASSO1_EMPRESA',
      status: 'AGUARDANDO_CLIENTE',
      progresso_pct: 15,
      documentos_obrigatorios_count: 3,
      documentos_enviados_count: 0,
      documentos_aprovados_count: 0,
      documentos_pendentes_count: 3,
      ai_validacao_status: 'PENDENTE',
      ai_validacao_alertas: [],
      ai_validacao_score: 75,
      solicitante_id: p.vendedor_atual_id,
      solicitante_nome: options?.solicitanteNome || p.vendedor_atual_nome,
      data_envio: today,
      sla_horas: 48,
      sla_estourado: false,
    }

    // Atualiza estágio comercial e cadastral no MESMO PARTY ID
    p.commercial_stage = 'PROSPECT'
    p.registration_status = 'FICHA_ENVIADA'
    p.onboardings = [onboarding, ...p.onboardings]

    p.timeline_360.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      etapa_origem: 'PROSPECT',
      tipo_evento: 'ficha_enviada',
      titulo: `Processo de Cadastro ${protocolo} Iniciado`,
      descricao: `Lead promovido a Prospect. Link seguro do Portal do Cliente gerado (Validade: 15 dias).`,
      usuario_nome: options?.solicitanteNome || 'Carlos Mendonça',
      modulo_origem: 'ONBOARDING_CORE',
      created: today,
    })

    p.audit_logs.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      entidade: 'crm_parties',
      entidade_id: p.crm_party_id,
      campo_alterado: 'commercial_stage',
      valor_anterior: 'LEAD_QUALIFICADO',
      valor_novo: 'PROSPECT',
      motivo_alteracao: `Abertura de Protocolo ${protocolo}`,
      usuario_id: 'qas-vendedor_teste',
      usuario_nome: options?.solicitanteNome || 'Carlos Mendonça',
      usuario_perfil: 'Comercial',
      created: new Date().toISOString(),
    })

    parties[idx] = p
    this.saveParties(parties)
    return { party: p, onboarding }
  }

  // 4. PREENCHER FICHA CADASTRAL / SALVAR E CONTINUAR DEPOIS
  public saveOnboardingStep(
    crmPartyId: string,
    onboardingId: string,
    stepData: {
      etapa: CrmOnboardingProcess['etapa_atual']
      empresa?: Partial<CrmPartyMaster>
      enderecos?: CrmPartyAddress[]
      contatos?: CrmPartyContact[]
      comercial?: {
        aplicacao: string
        produtos: string
        condicaoPretendida: string
        modalidadeFrete: string
        restricoesDescarga?: string
        janelaRecebimento?: string
      }
      progressoPct?: number
    },
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const onbIdx = p.onboardings.findIndex((o) => o.id === onboardingId)
    if (onbIdx !== -1) {
      p.onboardings[onbIdx].etapa_atual = stepData.etapa
      if (stepData.progressoPct !== undefined) {
        p.onboardings[onbIdx].progresso_pct = stepData.progressoPct
      }
      p.onboardings[onbIdx].status = 'DOCUMENTACAO_INCOMPLETA'
    }

    if (stepData.empresa) {
      if (stepData.empresa.cnpj_cpf) p.cnpj_cpf = stepData.empresa.cnpj_cpf
      if (stepData.empresa.razao_social) p.razao_social = stepData.empresa.razao_social
      if (stepData.empresa.nome_fantasia) p.nome_fantasia = stepData.empresa.nome_fantasia
      if (stepData.empresa.inscricao_estadual)
        p.inscricao_estadual = stepData.empresa.inscricao_estadual
      if (stepData.empresa.cnae) p.cnae = stepData.empresa.cnae
      if (stepData.empresa.regime_tributario)
        p.regime_tributario = stepData.empresa.regime_tributario
      if (stepData.empresa.website) p.website = stepData.empresa.website
    }

    if (stepData.enderecos && stepData.enderecos.length > 0) {
      p.enderecos = stepData.enderecos
      const sed = stepData.enderecos.find((e) => e.tipo === 'SEDE') || stepData.enderecos[0]
      p.cidade = sed.cidade
      p.uf = sed.uf
    }

    if (stepData.contatos && stepData.contatos.length > 0) {
      p.contatos = stepData.contatos
    }

    parties[idx] = p
    this.saveParties(parties)
    return p
  }

  // 5. UPLOAD DE DOCUMENTO COM VERSIONAMENTO (V1, V2, V3...)
  public uploadDocument(
    crmPartyId: string,
    onboardingId: string,
    documentData: {
      tipoDocumento: CrmDocumentItem['tipo_documento']
      nomeArquivo: string
      tamanhoBytes: number
      mimetype: string
      origem: CrmDocumentItem['upload_origem']
      uploadedBy: string
    },
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }

    // Calcula versão sequencial para o mesmo tipo de documento
    const existingSameType = p.documentos.filter(
      (d) => d.tipo_documento === documentData.tipoDocumento,
    )
    const nextVersion = existingSameType.length + 1

    const newDoc: CrmDocumentItem = {
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      onboarding_id: onboardingId,
      tipo_documento: documentData.tipoDocumento,
      nome_arquivo: documentData.nomeArquivo,
      versao: nextVersion,
      status: 'EM_ANALISE',
      arquivo_url: `/docs/mock_${documentData.tipoDocumento}_v${nextVersion}.pdf`,
      tamanho_bytes: documentData.tamanhoBytes,
      mimetype: documentData.mimetype,
      obrigatorio: true,
      upload_por_usuario: documentData.uploadedBy,
      upload_origem: documentData.origem,
      created: new Date().toLocaleDateString('pt-BR'),
    }

    p.documentos.unshift(newDoc)

    // Atualiza contadores do onboarding
    const onbIdx = p.onboardings.findIndex((o) => o.id === onboardingId)
    if (onbIdx !== -1) {
      p.onboardings[onbIdx].documentos_enviados_count += 1
      p.onboardings[onbIdx].documentos_pendentes_count = Math.max(
        0,
        p.onboardings[onbIdx].documentos_obrigatorios_count -
          p.onboardings[onbIdx].documentos_enviados_count,
      )
      p.onboardings[onbIdx].status = 'AGUARDANDO_FINANCEIRO'
      p.onboardings[onbIdx].progresso_pct = 75
    }

    p.registration_status = 'EM_ANALISE'

    p.timeline_360.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      etapa_origem: 'CADASTRO_EM_ANDAMENTO',
      tipo_evento: 'doc_enviado',
      titulo: `Documento ${documentData.tipoDocumento} (V${nextVersion}) Enviado`,
      descricao: `Arquivo: ${documentData.nomeArquivo} (${(documentData.tamanhoBytes / 1024).toFixed(0)} KB) por ${documentData.uploadedBy}.`,
      usuario_nome: documentData.uploadedBy,
      modulo_origem: 'PORTAL_DOCUMENTOS',
      created: new Date().toLocaleDateString('pt-BR'),
    })

    parties[idx] = p
    this.saveParties(parties)
    return p
  }

  // 6. ANÁLISE FINANCEIRA & CADASTRO (Aprovar, Solicitar Correção, Reprovar)
  public submitFinancialDecision(
    crmPartyId: string,
    onboardingId: string,
    decision: {
      action: 'APROVAR' | 'SOLICITAR_CORRECAO' | 'SOLICITAR_DOC' | 'REPROVAR'
      analistaNome: string
      motivoOuJustificativa?: string
      limiteCreditoSugerido?: number
      condicaoPagamentoSugerida?: string
    },
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const onbIdx = p.onboardings.findIndex((o) => o.id === onboardingId)
    const today = new Date().toLocaleDateString('pt-BR')

    if (decision.action === 'APROVAR') {
      p.registration_status = 'APROVADO'
      p.commercial_stage = 'CADASTRO_SAP'

      if (onbIdx !== -1) {
        p.onboardings[onbIdx].status = 'AGUARDANDO_SAP'
        p.onboardings[onbIdx].analista_financeiro_nome = decision.analistaNome
        p.onboardings[onbIdx].justificativa_decisao = decision.motivoOuJustificativa
        p.onboardings[onbIdx].progresso_pct = 90
      }

      // Prepara análise de crédito preliminar
      p.credit_status = 'EM_ANALISE'
      p.analise_credito = {
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        status: 'EM_ANALISE',
        limite_solicitado: decision.limiteCreditoSugerido || 150000,
        limite_aprovado: 0,
        limite_utilizado: 0,
        limite_disponivel: 0,
        titulos_vencidos_valor: 0,
        titulos_a_vencer_valor: 0,
        pedidos_em_carteira_valor: 0,
        exposicao_total: 0,
        dias_vencimento_medio: 30,
        condicao_pagamento_recomendada: decision.condicaoPagamentoSugerida || '30 DDL',
        score_serasa: 780,
        parecer_ia:
          'Documentação compatível com faturamento declarado. Recomenda-se aprovação de crédito com limite de até R$ 150k.',
        ia_risco_nivel: 'BAIXO',
      }

      // Enfileira integração SAP ECC de forma auditável
      this.enqueueSapIntegration(p.crm_party_id, onboardingId, {
        razao_social: p.razao_social,
        cnpj: p.cnpj_cpf,
        cidade: p.cidade,
        uf: p.uf,
        condicao: decision.condicaoPagamentoSugerida || '30 DDL',
      })

      p.timeline_360.unshift({
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        etapa_origem: 'ANALISE_FINANCEIRA',
        tipo_evento: 'cadastro_aprovado',
        titulo: 'Cadastro Aprovado pelo Financeiro',
        descricao: `Aprovado por ${decision.analistaNome}. Enviado para fila de integração SAP ECC.`,
        usuario_nome: decision.analistaNome,
        modulo_origem: 'FINANCEIRO_CREDITO',
        created: today,
      })
    } else if (decision.action === 'SOLICITAR_CORRECAO' || decision.action === 'SOLICITAR_DOC') {
      p.registration_status = 'DOCUMENTACAO_PENDENTE'
      if (onbIdx !== -1) {
        p.onboardings[onbIdx].status = 'PENDENCIA_CLIENTE'
        p.onboardings[onbIdx].motivo_pendencia =
          decision.motivoOuJustificativa || 'Documento complementar necessário'
      }

      p.timeline_360.unshift({
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        etapa_origem: 'ANALISE_FINANCEIRA',
        tipo_evento: 'solicitacao_correcao',
        titulo: 'Financeiro Solicitou Correção / Documento',
        descricao: decision.motivoOuJustificativa || 'Verificar pendências apontadas.',
        usuario_nome: decision.analistaNome,
        modulo_origem: 'FINANCEIRO_CREDITO',
        created: today,
      })
    } else if (decision.action === 'REPROVAR') {
      p.registration_status = 'REPROVADO'
      if (onbIdx !== -1) {
        p.onboardings[onbIdx].status = 'CONCLUIDO'
        p.onboardings[onbIdx].justificativa_decisao = decision.motivoOuJustificativa
      }

      p.timeline_360.unshift({
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        etapa_origem: 'ANALISE_FINANCEIRA',
        tipo_evento: 'doc_rejeitado',
        titulo: 'Cadastro Reprovado pelo Financeiro',
        descricao: `Justificativa: ${decision.motivoOuJustificativa || 'Restrição cadastral'}.`,
        usuario_nome: decision.analistaNome,
        modulo_origem: 'FINANCEIRO_CREDITO',
        created: today,
      })
    }

    parties[idx] = p
    this.saveParties(parties)
    return p
  }

  // 7. FILA DE INTEGRAÇÃO SAP ECC & RETORNO DO CÓDIGO SAP (MANTÉM CRM PARTY ID)
  public enqueueSapIntegration(
    crmPartyId: string,
    onboardingId: string,
    payload: Record<string, any>,
  ): CrmSapIntegrationQueueItem {
    const queue = this.getSapQueue()
    const item: CrmSapIntegrationQueueItem = {
      id: generateUuid(),
      crm_party_id: crmPartyId,
      onboarding_id: onboardingId,
      operacao: 'CREATE_CUSTOMER',
      payload_sap: payload,
      status: 'PENDENTE',
      tentativas: 1,
      max_tentativas: 3,
      enviado_em: new Date().toISOString(),
    }

    queue.unshift(item)
    this.saveSapQueue(queue)
    return item
  }

  public getSapQueue(): CrmSapIntegrationQueueItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAP_QUEUE)
      if (stored) return JSON.parse(stored)
    } catch {
      // fallback
    }
    return []
  }

  public saveSapQueue(queue: CrmSapIntegrationQueueItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SAP_QUEUE, JSON.stringify(queue))
    } catch {
      // silent
    }
  }

  // Executa processamento simulado da fila SAP ECC gerando código SAP (Ex: 00172893)
  public processSapIntegrationSuccess(
    crmPartyId: string,
    generatedSapCode?: string,
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const sapCode = generatedSapCode || `001${Math.floor(10000 + Math.random() * 90000)}`
    const today = new Date().toLocaleDateString('pt-BR')

    p.sap_customer_id = sapCode
    p.sap_sync_status = 'SINCRONIZADO'
    p.sap_sync_last_at = new Date().toISOString().replace('T', ' ').slice(0, 16)
    p.commercial_stage = 'CLIENTE_SAP'
    p.registration_status = 'CADASTRO_SAP_CONCLUIDO'

    // Mapeamento SAP
    p.sap_mappings = [
      {
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        sap_customer_id: sapCode,
        empresa_sap: '1000',
        org_vendas: '1000',
        canal_distribuicao: '10',
        setor_atividade: '00',
        centro_distribuicao: '1010',
        condicao_pagamento: '30/60 DDL',
        status: 'ATIVO',
      },
    ]

    // Conclui onboardings
    p.onboardings = p.onboardings.map((o) => ({
      ...o,
      status: 'CONCLUIDO',
      progresso_pct: 100,
      data_conclusao: today,
    }))

    // Aprova análise de crédito
    if (p.analise_credito) {
      p.credit_status = 'APROVADO'
      p.analise_credito.status = 'APROVADO'
      p.analise_credito.limite_aprovado = p.analise_credito.limite_solicitado || 150000
      p.analise_credito.limite_disponivel = p.analise_credito.limite_aprovado
      p.analise_credito.decisao_humana_por = 'Comitê de Crédito CIAFAL'
      p.analise_credito.decisao_humana_em = today
    }

    p.timeline_360.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      etapa_origem: 'CLIENTE_SAP',
      tipo_evento: 'sap_integrado',
      titulo: `Cliente SAP ECC Criado: Código ${sapCode}`,
      descricao: `Código SAP ${sapCode} atribuído ao registro ${p.friendly_code}. Limite de crédito aprovado: R$ ${(p.analise_credito?.limite_aprovado || 150000).toLocaleString('pt-BR')}.`,
      usuario_nome: 'BAPI_CUSTOMER_CREATE (SAP ECC)',
      modulo_origem: 'SAP_ECC_RFC',
      created: today,
    })

    p.audit_logs.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      entidade: 'crm_parties',
      entidade_id: p.crm_party_id,
      campo_alterado: 'sap_customer_id',
      valor_anterior: '',
      valor_novo: sapCode,
      motivo_alteracao: 'Criação mestre no SAP ECC',
      usuario_id: 'sys-sap',
      usuario_nome: 'BAPI SAP ECC',
      usuario_perfil: 'Administrador',
      created: new Date().toISOString(),
    })

    parties[idx] = p
    this.saveParties(parties)
    return p
  }

  // 8. REGISTRAR PRIMEIRA COTAÇÃO / PEDIDO / FATURAMENTO (Mede Tempos e Conversões)
  public recordBusinessMilestone(
    crmPartyId: string,
    milestone: {
      type: 'COTACAO' | 'PEDIDO' | 'FATURAMENTO'
      code: string
      valor: number
      toneladas: number
      usuarioNome?: string
    },
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const today = new Date().toLocaleDateString('pt-BR')

    if (milestone.type === 'COTACAO') {
      if (!p.data_primeira_cotacao) {
        p.data_primeira_cotacao = today
      }
      p.commercial_stage = 'PRIMEIRA_COTACAO'
      p.business_status = 'COTACAO'

      p.timeline_360.unshift({
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        etapa_origem: 'PRIMEIRA_COTACAO',
        tipo_evento: 'cotacao_criada',
        titulo: `Cotação ${milestone.code} Emitida`,
        descricao: `Primeira proposta comercial: ${milestone.toneladas} t · R$ ${milestone.valor.toLocaleString('pt-BR')}.`,
        usuario_nome: milestone.usuarioNome || p.vendedor_atual_nome,
        modulo_origem: 'CRM_COTACOES',
        valor: milestone.valor,
        volume_tons: milestone.toneladas,
        created: today,
      })
    } else if (milestone.type === 'PEDIDO') {
      if (!p.data_primeiro_pedido) {
        p.data_primeiro_pedido = today
        p.tempo_cliente_para_pedido_dias = 4
      }
      p.commercial_stage = 'PRIMEIRO_PEDIDO'
      p.business_status = 'PEDIDO'

      p.timeline_360.unshift({
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        etapa_origem: 'PRIMEIRO_PEDIDO',
        tipo_evento: 'pedido_gerado',
        titulo: `Primeiro Pedido de Venda Gerado: ${milestone.code}`,
        descricao: `Pedido confirmado no SAP ECC: ${milestone.toneladas} t · R$ ${milestone.valor.toLocaleString('pt-BR')}.`,
        usuario_nome: milestone.usuarioNome || p.vendedor_atual_nome,
        modulo_origem: 'SAP_VA01',
        valor: milestone.valor,
        volume_tons: milestone.toneladas,
        created: today,
      })
    } else if (milestone.type === 'FATURAMENTO') {
      if (!p.data_primeiro_faturamento) {
        p.data_primeiro_faturamento = today
        p.valor_primeiro_faturamento = milestone.valor
        p.tons_primeiro_faturamento = milestone.toneladas
        p.tempo_pedido_para_faturamento_dias = 2
        p.tempo_lead_para_faturamento_dias = 18
      }
      p.commercial_stage = 'CLIENTE_ATIVO'
      p.business_status = 'FATURADO'

      p.timeline_360.unshift({
        id: generateUuid(),
        crm_party_id: p.crm_party_id,
        etapa_origem: 'CLIENTE_ATIVO',
        tipo_evento: 'faturamento_concluido',
        titulo: `Primeiro Faturamento Realizado: NF ${milestone.code}`,
        descricao: `Cliente ativado comercialmente! Faturamento de ${milestone.toneladas} t (R$ ${milestone.valor.toLocaleString('pt-BR')}).`,
        usuario_nome: 'SAP_VF01',
        modulo_origem: 'SAP_ECC_FATURAMENTO',
        valor: milestone.valor,
        volume_tons: milestone.toneladas,
        created: today,
      })
    }

    parties[idx] = p
    this.saveParties(parties)
    return p
  }

  // 9. TRANSFERÊNCIA DE CARTEIRA (Mantém CRM ID, registra histórico)
  public transferSeller(
    crmPartyId: string,
    newSeller: {
      sellerId: string
      sellerName: string
      reason: string
      transferredBy: string
    },
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const oldSeller = p.vendedor_atual_nome
    const today = new Date().toLocaleDateString('pt-BR')

    p.vendedor_atual_id = newSeller.sellerId
    p.vendedor_atual_nome = newSeller.sellerName

    p.timeline_360.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      etapa_origem: p.commercial_stage,
      tipo_evento: 'transferencia_carteira',
      titulo: 'Transferência de Carteira Comercial',
      descricao: `Vendedor alterado de "${oldSeller}" para "${newSeller.sellerName}". Motivo: ${newSeller.reason}`,
      usuario_nome: newSeller.transferredBy,
      modulo_origem: 'CRM_ADMIN',
      created: today,
    })

    p.audit_logs.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      entidade: 'crm_parties',
      entidade_id: p.crm_party_id,
      campo_alterado: 'vendedor_atual_id',
      valor_anterior: oldSeller,
      valor_novo: newSeller.sellerName,
      motivo_alteracao: newSeller.reason,
      usuario_id: 'admin',
      usuario_nome: newSeller.transferredBy,
      usuario_perfil: 'Gestor Comercial',
      created: new Date().toISOString(),
    })

    parties[idx] = p
    this.saveParties(parties)
    return p
  }

  // 10. REATIVAR OPORTUNIDADE (Não cria outro Lead — abre novo ciclo)
  public reactivateOpportunity(
    crmPartyId: string,
    cycleData: {
      titulo: string
      valor: number
      toneladas: number
      produtoFamilia: string
      userName: string
    },
  ): CrmPartyMaster {
    const parties = this.getParties()
    const idx = parties.findIndex((p) => p.crm_party_id === crmPartyId)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const p = { ...parties[idx] }
    const today = new Date().toLocaleDateString('pt-BR')
    const oppCode = `OPP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`

    const newOpp: CommercialCycleOpportunity = {
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      codigo_oportunidade: oppCode,
      titulo: cycleData.titulo,
      valor: cycleData.valor,
      toneladas: cycleData.toneladas,
      estagio: 'NOVA',
      probabilidade: 60,
      produto_familia: cycleData.produtoFamilia,
      vendedor_nome: cycleData.userName,
      created: today,
    }

    p.is_reativado = true
    p.data_reativacao = today
    p.business_status = 'OPORTUNIDADE_ABERTA'
    p.oportunidades_ciclos.unshift(newOpp)

    p.timeline_360.unshift({
      id: generateUuid(),
      crm_party_id: p.crm_party_id,
      etapa_origem: p.commercial_stage,
      tipo_evento: 'reativacao',
      titulo: `Novo Ciclo Comercial Aberto (${oppCode})`,
      descricao: `Oportunidade reativada no mesmo registro: ${cycleData.titulo} (${cycleData.toneladas} t · R$ ${cycleData.valor.toLocaleString('pt-BR')}).`,
      usuario_nome: cycleData.userName,
      modulo_origem: 'CRM_OPPORTUNITY',
      valor: cycleData.valor,
      volume_tons: cycleData.toneladas,
      created: today,
    })

    parties[idx] = p
    this.saveParties(parties)
    return p
  }
}

export const crmPartyService = new CrmPartyService()
