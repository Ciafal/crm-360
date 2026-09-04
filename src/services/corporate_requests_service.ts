import { crmStorage } from '@/lib/crm-storage'
import {
  CorporateRequest,
  CorporateRequestType,
  CorporateRequestStatus,
  WorkflowAuditStep,
  CorporateRequestComment,
  CorporateRequestAttachment,
  RequestViagemData,
  RequestTreinamentoInternoData,
  RequestTreinamentoExternoData,
  RequestVisitaTecnicaData,
  RequestVisitaFornecedorData,
  RequestVisitaParceiroData,
  RequestReembolsoData,
} from '@/types/models'

const STORAGE_KEY = 'ciafal_corporate_requests_v1'

const INITIAL_REQUESTS: CorporateRequest[] = [
  {
    id: 'req-001',
    code: 'SOL-2024-001',
    request_type: 'VIAGEM',
    title: 'Viagem Comercial — Fechamento Anual Gerdau & Minas Ligas',
    requester_id: 'usr-carlos',
    requester_name: 'Carlos Mendonça',
    requester_email: 'carlos.mendonca@ciafal.com.br',
    matricula: 'TOTVS-8801',
    department: 'Comercial — Vendas Minas',
    cost_center: 'CC-1020 — Vendas Indústria',
    manager_id: 'usr-roberto',
    manager_name: 'Roberto Silveira (Supervisor)',
    current_approver_id: 'usr-diretor',
    current_approver_name: 'Dr. Fernando Dias (Diretoria Comercial)',
    current_approver_role: 'Diretoria Comercial',
    status: 'EM_APROVACAO',
    priority: 'ALTA',
    created_at: '2024-10-15T09:30:00Z',
    submitted_at: '2024-10-15T10:15:00Z',
    estimated_cost: 3200,
    currency: 'BRL',
    justification:
      'Reunião executiva de alinhamento de contrato anual de fornecimento de perfis laminados para o polo siderúrgico.',
    type_data: {
      origin: 'Belo Horizonte / MG',
      destination: 'Piracicaba / SP',
      departure_date: '2024-11-05',
      return_date: '2024-11-07',
      transport_type: 'AEREO',
      need_hotel: true,
      hotel_nights: 2,
      need_flight: true,
      flight_preference: 'Voo direto manhã Confins -> Viracopos',
      need_advance_payment: true,
      advance_amount: 800,
      related_entity_type: 'CLIENTE',
      related_entity_name: 'Gerdau Aços Especiais Piracicaba',
    } as RequestViagemData,
    attachments: [
      {
        id: 'att-1',
        name: 'Pauta_Reuniao_Gerdau_2024.pdf',
        size_bytes: 420000,
        uploaded_at: '2024-10-15T09:35:00Z',
        url: '#',
      },
    ],
    comments: [
      {
        id: 'com-1',
        user_id: 'usr-roberto',
        user_name: 'Roberto Silveira',
        timestamp: '2024-10-15T11:00:00Z',
        content: 'Aprovado pelo gestor imediato. Encaminhado para a diretoria pelo valor estimado.',
      },
    ],
    audit_log: [
      {
        id: 'aud-1',
        action: 'Criação do rascunho',
        user_id: 'usr-carlos',
        user_name: 'Carlos Mendonça',
        role: 'Vendedor',
        timestamp: '2024-10-15T09:30:00Z',
        new_status: 'RASCUNHO',
      },
      {
        id: 'aud-2',
        action: 'Submissão para aprovação',
        user_id: 'usr-carlos',
        user_name: 'Carlos Mendonça',
        role: 'Vendedor',
        timestamp: '2024-10-15T10:15:00Z',
        previous_status: 'RASCUNHO',
        new_status: 'ENVIADO',
      },
      {
        id: 'aud-3',
        action: 'Aprovação pelo Gestor Imediato',
        user_id: 'usr-roberto',
        user_name: 'Roberto Silveira',
        role: 'Supervisor',
        timestamp: '2024-10-15T11:00:00Z',
        previous_status: 'ENVIADO',
        new_status: 'EM_APROVACAO',
      },
    ],
    workflow_stage_index: 2,
    workflow_stages_total: 4,
  },
  {
    id: 'req-002',
    code: 'SOL-2024-002',
    request_type: 'TREINAMENTO_EXTERNO',
    title: 'Especialização em Metalurgia do Aço & Fadiga Estrutural',
    requester_id: 'usr-mariana',
    requester_name: 'Mariana Rios',
    requester_email: 'mariana.rios@ciafal.com.br',
    matricula: 'TOTVS-8812',
    department: 'Engenharia de Aplicação & SGQ',
    cost_center: 'CC-3010 — Qualidade & Engenharia',
    manager_id: 'usr-carlos-eng',
    manager_name: 'Carlos Eduardo (Gerente Industrial)',
    current_approver_id: 'usr-hcm-diretor',
    current_approver_name: 'HCM / Pessoas & Governança',
    current_approver_role: 'HCM / RH Corporativo',
    status: 'APROVADO',
    priority: 'MEDIA',
    created_at: '2024-10-10T14:00:00Z',
    submitted_at: '2024-10-10T15:20:00Z',
    approved_at: '2024-10-12T16:00:00Z',
    estimated_cost: 4500,
    currency: 'BRL',
    justification:
      'Capacitação técnica para suporte avançado a clientes de caldeiraria pesada e laudos técnicos de ensaios destrutivos.',
    type_data: {
      institution: 'Associação Brasileira de Metalurgia, Materiais e Mineração (ABM)',
      course_name: 'Curso Avançado de Conformação Mecânica e Falhas em Perfis Estruturais',
      city_uf: 'São Paulo / SP',
      modality: 'HIBRIDO',
      registration_cost: 4500,
      expected_certificate: true,
      integrated_with_hcm: true,
    } as RequestTreinamentoExternoData,
    attachments: [
      {
        id: 'att-2',
        name: 'Ementa_Curso_ABM_2024.pdf',
        size_bytes: 850000,
        uploaded_at: '2024-10-10T14:10:00Z',
        url: '#',
      },
    ],
    comments: [
      {
        id: 'com-2',
        user_id: 'usr-hcm',
        user_name: 'Aline Santos (HCM)',
        timestamp: '2024-10-12T16:00:00Z',
        content:
          'Aprovado pelo comitê de capacitação. Vínculo automático criado no HCM com meta de envio de certificado pós-conclusão.',
      },
    ],
    audit_log: [
      {
        id: 'aud-4',
        action: 'Aprovação Final HCM & Orçamento',
        user_id: 'usr-hcm',
        user_name: 'Aline Santos',
        role: 'HCM Pessoas',
        timestamp: '2024-10-12T16:00:00Z',
        previous_status: 'EM_APROVACAO',
        new_status: 'APROVADO',
      },
    ],
    workflow_stage_index: 4,
    workflow_stages_total: 4,
  },
  {
    id: 'req-003',
    code: 'SOL-2024-003',
    request_type: 'VISITA_TECNICA_CLIENTE',
    title: 'Visita Técnica — Teste de Soldabilidade em Chapas Grossas',
    requester_id: 'usr-carlos',
    requester_name: 'Carlos Mendonça',
    requester_email: 'carlos.mendonca@ciafal.com.br',
    matricula: 'TOTVS-8801',
    department: 'Comercial — Vendas Indústria',
    cost_center: 'CC-1020 — Vendas Indústria',
    manager_id: 'usr-roberto',
    manager_name: 'Roberto Silveira (Supervisor)',
    current_approver_id: 'usr-roberto',
    current_approver_name: 'Roberto Silveira (Supervisor)',
    current_approver_role: 'Supervisor Comercial',
    status: 'CONCLUIDO',
    priority: 'MEDIA',
    created_at: '2024-10-08T08:00:00Z',
    submitted_at: '2024-10-08T08:30:00Z',
    approved_at: '2024-10-08T09:00:00Z',
    concluded_at: '2024-10-11T17:00:00Z',
    estimated_cost: 150,
    currency: 'BRL',
    justification:
      'Acompanhamento de dobra e solda MIG/MAG na planta do cliente para validação de lote de 22 toneladas.',
    type_data: {
      customer_id: 'cli-100002',
      sap_customer_code: '0001048820',
      customer_name: 'Aços & Caldeiraria Betim S.A.',
      unit_address: 'Av. das Indústrias, 4500 - Distrito Industrial - Betim/MG',
      contacts: 'Roberto (Diretor Industrial) / Marcelo (Eng. Produção)',
      objective: 'Validar ensaios de conformação de Chapas Grossas ASTM A36 12.5mm.',
      reason: 'Homologação técnica para fechamento de pedido de 22t.',
      seller_id: 'usr-carlos',
      seller_name: 'Carlos Mendonça',
      technical_lead: 'Eng. Maurício Ramos (Qualidade CIAFAL)',
      participants: 'Carlos Mendonça, Eng. Maurício Ramos',
      visit_date: '2024-10-11',
      visit_time: '14:30',
      location: 'Betim / MG',
      need_travel: false,
      expected_result: 'Laudo técnico favorável para emissão da cotação formal.',
      crm_integration_status: 'SYNCED',
    } as RequestVisitaTecnicaData,
    attachments: [],
    comments: [],
    audit_log: [
      {
        id: 'aud-5',
        action: 'Visita Técnica Concluída e Integrada ao CRM 360',
        user_id: 'usr-carlos',
        user_name: 'Carlos Mendonça',
        role: 'Vendedor',
        timestamp: '2024-10-11T17:00:00Z',
        previous_status: 'EM_EXECUCAO',
        new_status: 'CONCLUIDO',
      },
    ],
    workflow_stage_index: 4,
    workflow_stages_total: 4,
  },
  {
    id: 'req-004',
    code: 'SOL-2024-004',
    request_type: 'REEMBOLSO',
    title: 'Reembolso de Despesas — Visita Técnica Betim (Combustível + Pedágio)',
    requester_id: 'usr-carlos',
    requester_name: 'Carlos Mendonça',
    requester_email: 'carlos.mendonca@ciafal.com.br',
    matricula: 'TOTVS-8801',
    department: 'Comercial — Vendas Indústria',
    cost_center: 'CC-1020 — Vendas Indústria',
    manager_id: 'usr-roberto',
    manager_name: 'Roberto Silveira (Supervisor)',
    current_approver_id: 'usr-financeiro',
    current_approver_name: 'Controladoria & Financeiro',
    current_approver_role: 'Financeiro ERP',
    status: 'APROVADO',
    priority: 'BAIXA',
    created_at: '2024-10-12T10:00:00Z',
    submitted_at: '2024-10-12T10:30:00Z',
    approved_at: '2024-10-14T11:00:00Z',
    estimated_cost: 142.5,
    currency: 'BRL',
    justification:
      'Deslocamento em veículo corporativo para realização da visita técnica aprovada SOL-2024-003.',
    type_data: {
      expense_type: 'COMBUSTIVEL',
      expense_date: '2024-10-11',
      amount: 142.5,
      currency: 'BRL',
      related_trip_request_id: 'req-003',
      related_trip_code: 'SOL-2024-003',
      receipts_count: 2,
      erp_status: 'READY_FOR_ERP',
    } as RequestReembolsoData,
    attachments: [
      {
        id: 'att-3',
        name: 'Comprovante_Posto_Petrobras_Betim.pdf',
        size_bytes: 310000,
        uploaded_at: '2024-10-12T10:15:00Z',
        url: '#',
      },
    ],
    comments: [],
    audit_log: [],
    workflow_stage_index: 3,
    workflow_stages_total: 4,
  },
]

export class CorporateRequestsService {
  private getStorage(): CorporateRequest[] {
    return crmStorage.getJSON<CorporateRequest[]>(STORAGE_KEY, INITIAL_REQUESTS)
  }

  private saveStorage(list: CorporateRequest[]): void {
    crmStorage.setJSON(STORAGE_KEY, list)
  }

  async listRequests(): Promise<CorporateRequest[]> {
    return this.getStorage()
  }

  async getRequestById(id: string): Promise<CorporateRequest | null> {
    const list = this.getStorage()
    return list.find((r) => r.id === id || r.code === id) || null
  }

  async createRequest(
    data: Omit<
      CorporateRequest,
      | 'id'
      | 'code'
      | 'created_at'
      | 'audit_log'
      | 'comments'
      | 'workflow_stage_index'
      | 'workflow_stages_total'
    >,
  ): Promise<CorporateRequest> {
    const list = this.getStorage()
    const count = list.length + 1
    const code = `SOL-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`
    const id = `req-${Date.now()}`

    const initialAudit: WorkflowAuditStep = {
      id: `aud-${Date.now()}`,
      action: data.status === 'ENVIADO' ? 'Solicitação criada e submetida' : 'Rascunho criado',
      user_id: data.requester_id,
      user_name: data.requester_name,
      timestamp: new Date().toISOString(),
      previous_status: 'RASCUNHO',
      new_status: data.status,
    }

    const newReq: CorporateRequest = {
      ...data,
      id,
      code,
      created_at: new Date().toISOString(),
      submitted_at: data.status === 'ENVIADO' ? new Date().toISOString() : undefined,
      attachments: data.attachments || [],
      comments: [],
      audit_log: [initialAudit],
      workflow_stage_index: data.status === 'ENVIADO' ? 2 : 1,
      workflow_stages_total: 4,
    }

    list.unshift(newReq)
    this.saveStorage(list)
    return newReq
  }

  async updateRequestStatus(
    id: string,
    action: 'SUBMETER' | 'APROVAR' | 'REJEITAR' | 'EXECUTAR' | 'CONCLUIR' | 'CANCELAR',
    userId: string,
    userName: string,
    userRole: string,
    comments?: string,
  ): Promise<CorporateRequest> {
    const list = this.getStorage()
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Solicitação não encontrada.')

    const current = list[idx]
    const prevStatus = current.status
    let newStatus: CorporateRequestStatus = current.status
    let newStage = current.workflow_stage_index

    const now = new Date().toISOString()

    switch (action) {
      case 'SUBMETER':
        newStatus = 'ENVIADO'
        current.submitted_at = now
        newStage = 2
        break
      case 'APROVAR':
        if (current.workflow_stage_index < 3) {
          newStatus = 'EM_APROVACAO'
          newStage = 3
        } else {
          newStatus = 'APROVADO'
          current.approved_at = now
          newStage = 4
        }
        break
      case 'REJEITAR':
        newStatus = 'REJEITADO'
        current.rejected_at = now
        break
      case 'EXECUTAR':
        newStatus = 'EM_EXECUCAO'
        break
      case 'CONCLUIR':
        newStatus = 'CONCLUIDO'
        current.concluded_at = now
        newStage = 4
        break
      case 'CANCELAR':
        newStatus = 'CANCELADO'
        break
    }

    const auditEntry: WorkflowAuditStep = {
      id: `aud-${Date.now()}`,
      action: `Ação de Workflow: ${action}`,
      user_id: userId,
      user_name: userName,
      role: userRole,
      timestamp: now,
      comments,
      previous_status: prevStatus,
      new_status: newStatus,
    }

    current.status = newStatus
    current.workflow_stage_index = newStage
    current.audit_log.push(auditEntry)

    if (comments) {
      current.comments.push({
        id: `com-${Date.now()}`,
        user_id: userId,
        user_name: userName,
        timestamp: now,
        content: comments,
      })
    }

    list[idx] = current
    this.saveStorage(list)
    return current
  }

  async addComment(
    id: string,
    userId: string,
    userName: string,
    content: string,
  ): Promise<CorporateRequest> {
    const list = this.getStorage()
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Solicitação não encontrada.')

    const current = list[idx]
    current.comments.push({
      id: `com-${Date.now()}`,
      user_id: userId,
      user_name: userName,
      timestamp: new Date().toISOString(),
      content,
    })

    list[idx] = current
    this.saveStorage(list)
    return current
  }
}

export const corporateRequestsService = new CorporateRequestsService()
