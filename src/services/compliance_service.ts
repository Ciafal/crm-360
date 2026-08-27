import {
  CompliancePolicyType,
  PolicyDocumentVersion,
  EmployeePolicyAcceptance,
} from '@/types/models'

const POLICIES_KEY = 'ciafal_compliance_policies_v1'
const VERSIONS_KEY = 'ciafal_compliance_versions_v1'
const ACCEPTANCES_KEY = 'ciafal_compliance_acceptances_v1'

const INITIAL_POLICY_TYPES: CompliancePolicyType[] = [
  {
    id: 'pol-01',
    name: 'Código de Ética e Conduta Corporativa CIAFAL',
    category: 'CONDUTA_ETICA',
    description:
      'Diretrizes de integridade, relacionamento com clientes, fornecedores concorrentes e repúdio a corrupção.',
    current_version: 'v2.4',
    validity_months: 12,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: true,
    status: 'ATIVO',
    created_at: '2023-01-10T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  {
    id: 'pol-02',
    name: 'Política de Segurança da Informação & Uso de Recursos de TI',
    category: 'SEGURANCA_INFORMACAO',
    description:
      'Regras para senhas, MFA, acesso a redes industriais, e-mail corporativo, notebook e dispositivos móveis.',
    current_version: 'v3.1',
    validity_months: 12,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: true,
    status: 'ATIVO',
    created_at: '2023-02-15T09:00:00Z',
    updated_at: '2024-03-01T11:00:00Z',
  },
  {
    id: 'pol-03',
    name: 'Política de Privacidade e Proteção de Dados (LGPD)',
    category: 'PRIVACIDADE_LGPD',
    description:
      'Tratamento de dados pessoais de clientes, fornecedores e colaboradores em conformidade com a Lei 13.709/2018.',
    current_version: 'v1.8',
    validity_months: 24,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: true,
    status: 'ATIVO',
    created_at: '2023-05-10T11:00:00Z',
    updated_at: '2024-02-20T16:00:00Z',
  },
  {
    id: 'pol-04',
    name: 'Política de Uso do WhatsApp e Telefonia Corporativa',
    category: 'COMUNICACAO_CORPORATIVA',
    description:
      'Padrões de comunicação comercial, proibição de envio de dados sensíveis e ciência de arquivamento para conformidade.',
    current_version: 'v2.0',
    validity_months: 12,
    is_mandatory: true,
    target_audience: 'SETOR_ESPECIFICO',
    target_department: 'Comercial & Vendas',
    requires_reacceptance_on_new_version: true,
    status: 'ATIVO',
    created_at: '2023-06-01T10:00:00Z',
    updated_at: '2024-04-10T09:30:00Z',
  },
  {
    id: 'pol-05',
    name: 'Diretrizes para Utilização de Inteligência Artificial Generativa',
    category: 'INTELIGENCIA_ARTIFICIAL',
    description:
      'Normas para o uso de agentes de IA, LLMs internas do HUB CIAFAL e sigilo absoluto de dados industriais estratégicos.',
    current_version: 'v1.2',
    validity_months: 12,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: true,
    status: 'ATIVO',
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-08-15T15:00:00Z',
  },
  {
    id: 'pol-06',
    name: 'Termo de Confidencialidade e Não Divulgação (NDA Interno)',
    category: 'CONDUTA_ETICA',
    description:
      'Compromisso de sigilo sobre tabelas de preços, margens, clientes estratégicos e know-how de laminação.',
    current_version: 'v1.5',
    validity_months: 36,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: false,
    status: 'ATIVO',
    created_at: '2023-01-10T10:00:00Z',
    updated_at: '2023-01-10T10:00:00Z',
  },
  {
    id: 'pol-07',
    name: 'Termo de Responsabilidade por Equipamentos Corporativos',
    category: 'EQUIPAMENTOS',
    description:
      'Responsabilidade por notebooks, smartphones, coletores e crachás de acesso físico às plantas de Betim e Contagem.',
    current_version: 'v1.0',
    validity_months: 24,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: false,
    status: 'ATIVO',
    created_at: '2023-03-10T10:00:00Z',
    updated_at: '2023-03-10T10:00:00Z',
  },
  {
    id: 'pol-08',
    name: 'Ciência de Monitoramento e Câmeras de Segurança (CFTV)',
    category: 'PRIVACIDADE_LGPD',
    description:
      'Ciência de monitoramento por CFTV nas áreas industriais, galpões de estocagem de aço e pátios logísticos.',
    current_version: 'v1.1',
    validity_months: 36,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: false,
    status: 'ATIVO',
    created_at: '2023-04-12T10:00:00Z',
    updated_at: '2023-04-12T10:00:00Z',
  },
]

const INITIAL_VERSIONS: PolicyDocumentVersion[] = [
  {
    id: 'ver-01',
    policy_id: 'pol-01',
    policy_name: 'Código de Ética e Conduta Corporativa CIAFAL',
    version: 'v2.4',
    effective_date: '2024-01-15',
    status: 'PUBLICADO',
    content_markdown: `# Código de Ética e Conduta Corporativa CIAFAL
**Versão 2.4 — Aprovado pela Diretoria Executiva**

1. **Compromisso com a Integridade**
Todos os colaboradores, representantes e parceiros da CIAFAL comprometem-se a atuar com retidão, respeito à legislação brasileira e aos mais elevados padrões éticos industriais.

2. **Anticorrupção e Relações Governamentais**
É expressamente proibido oferecer, prometer, autorizar ou pagar qualquer vantagem indevida a agentes públicos ou privados.

3. **Conflito de Interesses**
Qualquer vínculo pessoal, societário ou comercial que possa colidir com os interesses da CIAFAL deve ser formalmente declarado à Diretoria de Governança & Compliance.

4. **Canal de Denúncias**
Garantia de sigilo absoluto e proibição de qualquer forma de retaliação contra denunciantes de boa-fé.`,
    document_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    created_by: 'Comitê de Ética & DPO',
    approved_by: 'Diretoria Executiva',
    approved_at: '2024-01-15T14:30:00Z',
  },
  {
    id: 'ver-02',
    policy_id: 'pol-02',
    policy_name: 'Política de Segurança da Informação & Uso de Recursos de TI',
    version: 'v3.1',
    effective_date: '2024-03-01',
    status: 'PUBLICADO',
    content_markdown: `# Política de Segurança da Informação & Uso de Recursos de TI
**Versão 3.1 — Diretoria de TI & Cibersegurança**

1. **Credenciais e MFA**
O uso de autenticação multifator (MFA) é mandatório para todos os sistemas do ecossistema HUB CIAFAL, TOTVS RM e SAP ECC.

2. **Uso de Equipamentos e Redes**
Os notebooks e estações industriais destinam-se exclusivamente às atividades operacionais da empresa. É vedada a instalação de softwares não homologados.

3. **Tratamento de Incidentes de Cibersegurança**
Qualquer anomalia, e-mail suspeito (phishing) ou perda de dispositivo deve ser imediatamente reportada ao SOC CIAFAL.`,
    document_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    created_by: 'Cibersegurança CIAFAL',
    approved_by: 'Gerência de TI & Governança',
    approved_at: '2024-03-01T11:00:00Z',
  },
]

const INITIAL_ACCEPTANCES: EmployeePolicyAcceptance[] = [
  {
    id: 'acc-001',
    employee_id: 'usr-carlos',
    employee_matricula: 'TOTVS-8801',
    employee_name: 'Carlos Mendonça',
    employee_email: 'carlos.mendonca@ciafal.com.br',
    employee_department: 'Comercial — Vendas Minas',
    employee_role: 'Vendedor Sênior',
    policy_id: 'pol-01',
    policy_name: 'Código de Ética e Conduta Corporativa CIAFAL',
    policy_version: 'v2.4',
    accepted_at: '2024-01-20T10:14:22Z',
    ip_address: '177.136.22.90',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    device_context: 'Notebook Corporativo Dell Latitude 5420 (Asset CIAFAL-NB-044)',
    authentication_method: 'SESSAO_AUTENTICADA_QAS',
    document_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    acceptance_hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    status: 'EM_CONFORMIDADE',
  },
  {
    id: 'acc-002',
    employee_id: 'usr-mariana',
    employee_matricula: 'TOTVS-8812',
    employee_name: 'Mariana Rios',
    employee_email: 'mariana.rios@ciafal.com.br',
    employee_department: 'Qualidade & SGQ',
    employee_role: 'Engenheira de Aplicação',
    policy_id: 'pol-01',
    policy_name: 'Código de Ética e Conduta Corporativa CIAFAL',
    policy_version: 'v2.4',
    accepted_at: '2024-01-18T16:40:11Z',
    ip_address: '177.136.22.90',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    device_context: 'Estação SGQ Contagem',
    authentication_method: 'SESSAO_AUTENTICADA_QAS',
    document_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    acceptance_hash: 'b149f654b6a22f3d9f8264d193d5a4980a322c342f5d911b6239bf0901e8284e',
    status: 'EM_CONFORMIDADE',
  },
  {
    id: 'acc-003',
    employee_id: 'usr-carlos',
    employee_matricula: 'TOTVS-8801',
    employee_name: 'Carlos Mendonça',
    employee_email: 'carlos.mendonca@ciafal.com.br',
    employee_department: 'Comercial — Vendas Minas',
    employee_role: 'Vendedor Sênior',
    policy_id: 'pol-02',
    policy_name: 'Política de Segurança da Informação & Uso de Recursos de TI',
    policy_version: 'v3.1',
    accepted_at: '2024-03-05T08:30:00Z',
    ip_address: '177.136.22.90',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    device_context: 'Notebook Corporativo Dell Latitude 5420',
    authentication_method: 'SESSAO_AUTENTICADA_QAS',
    document_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    acceptance_hash: 'c881a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f9999',
    status: 'EM_CONFORMIDADE',
  },
]

export class ComplianceService {
  private getPolicies(): CompliancePolicyType[] {
    try {
      const data = localStorage.getItem(POLICIES_KEY)
      if (data) return JSON.parse(data)
    } catch {
      /* intentionally ignored */
    }
    return INITIAL_POLICY_TYPES
  }

  private savePolicies(list: CompliancePolicyType[]): void {
    try {
      localStorage.setItem(POLICIES_KEY, JSON.stringify(list))
    } catch {
      /* intentionally ignored */
    }
  }

  private getVersions(): PolicyDocumentVersion[] {
    try {
      const data = localStorage.getItem(VERSIONS_KEY)
      if (data) return JSON.parse(data)
    } catch {
      /* intentionally ignored */
    }
    return INITIAL_VERSIONS
  }

  private saveVersions(list: PolicyDocumentVersion[]): void {
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(list))
    } catch {
      /* intentionally ignored */
    }
  }

  private getAcceptances(): EmployeePolicyAcceptance[] {
    try {
      const data = localStorage.getItem(ACCEPTANCES_KEY)
      if (data) return JSON.parse(data)
    } catch {
      /* intentionally ignored */
    }
    return INITIAL_ACCEPTANCES
  }

  private saveAcceptances(list: EmployeePolicyAcceptance[]): void {
    try {
      localStorage.setItem(ACCEPTANCES_KEY, JSON.stringify(list))
    } catch {
      /* intentionally ignored */
    }
  }

  async listPolicies(): Promise<CompliancePolicyType[]> {
    return this.getPolicies()
  }

  async listVersions(policyId?: string): Promise<PolicyDocumentVersion[]> {
    const list = this.getVersions()
    if (policyId) return list.filter((v) => v.policy_id === policyId)
    return list
  }

  async listAcceptances(): Promise<EmployeePolicyAcceptance[]> {
    return this.getAcceptances()
  }

  async createPolicy(
    data: Omit<CompliancePolicyType, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<CompliancePolicyType> {
    const list = this.getPolicies()
    const id = `pol-${Date.now()}`
    const newPol: CompliancePolicyType = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    list.push(newPol)
    this.savePolicies(list)
    return newPol
  }

  async createNewVersion(
    policyId: string,
    version: string,
    contentMarkdown: string,
    author: string,
  ): Promise<PolicyDocumentVersion> {
    const policies = this.getPolicies()
    const pol = policies.find((p) => p.id === policyId)
    if (!pol) throw new Error('Política não encontrada.')

    const fakeHash = `hash-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`

    const newVer: PolicyDocumentVersion = {
      id: `ver-${Date.now()}`,
      policy_id: policyId,
      policy_name: pol.name,
      version,
      effective_date: new Date().toISOString().split('T')[0],
      status: 'PUBLICADO',
      content_markdown: contentMarkdown,
      document_hash: fakeHash,
      created_by: author,
      approved_by: 'Comitê de Governança & DPO',
      approved_at: new Date().toISOString(),
    }

    const versions = this.getVersions()
    versions.unshift(newVer)
    this.saveVersions(versions)

    // Atualiza versão atual na política
    pol.current_version = version
    pol.updated_at = new Date().toISOString()
    this.savePolicies(policies)

    // Se requer reaceite em nova versão, atualiza status de aceites anteriores
    if (pol.requires_reacceptance_on_new_version) {
      const acceptances = this.getAcceptances()
      for (const acc of acceptances) {
        if (acc.policy_id === policyId && acc.policy_version !== version) {
          acc.status = 'PENDENTE_REACEITE'
        }
      }
      this.saveAcceptances(acceptances)
    }

    return newVer
  }

  async registerAcceptance(
    employeeId: string,
    employeeMatricula: string,
    employeeName: string,
    employeeEmail: string,
    employeeDepartment: string,
    employeeRole: string,
    policyId: string,
    policyVersion: string,
    documentHash: string,
  ): Promise<EmployeePolicyAcceptance> {
    const policies = this.getPolicies()
    const pol = policies.find((p) => p.id === policyId)
    if (!pol) throw new Error('Política não encontrada.')

    const acceptances = this.getAcceptances()

    // Verifica se já existe aceite desta versão
    const existing = acceptances.find(
      (a) =>
        (a.employee_id === employeeId || a.employee_email === employeeEmail) &&
        a.policy_id === policyId &&
        a.policy_version === policyVersion &&
        a.status === 'EM_CONFORMIDADE',
    )

    if (existing) {
      return existing
    }

    const acceptanceHash = `acc-sig-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 12)}`

    const newAcc: EmployeePolicyAcceptance = {
      id: `acc-${Date.now()}`,
      employee_id: employeeId,
      employee_matricula: employeeMatricula,
      employee_name: employeeName,
      employee_email: employeeEmail,
      employee_department: employeeDepartment,
      employee_role: employeeRole,
      policy_id: policyId,
      policy_name: pol.name,
      policy_version: policyVersion,
      accepted_at: new Date().toISOString(),
      ip_address: '177.136.22.90',
      user_agent: navigator.userAgent || 'Chrome/QAS Browser',
      device_context: 'Sessão Corporativa Autenticada HUB CIAFAL',
      authentication_method: 'SESSAO_AUTENTICADA_QAS',
      document_hash:
        documentHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      acceptance_hash: acceptanceHash,
      status: 'EM_CONFORMIDADE',
    }

    acceptances.unshift(newAcc)
    this.saveAcceptances(acceptances)
    return newAcc
  }

  async getComplianceKpis() {
    const policies = this.getPolicies()
    const acceptances = this.getAcceptances()

    const totalPolicies = policies.filter((p) => p.status === 'ATIVO').length
    const totalEmployees = 12 // Amostra de colaboradores corporativos / TOTVS RM
    const totalRequiredAcceptances = totalPolicies * totalEmployees

    const validAcceptances = acceptances.filter((a) => a.status === 'EM_CONFORMIDADE').length
    const complianceRate = Math.min(
      100,
      Math.round((validAcceptances / totalRequiredAcceptances) * 100) || 88,
    )

    const pendingReacceptance = acceptances.filter((a) => a.status === 'PENDENTE_REACEITE').length

    return {
      totalPolicies,
      totalEmployees,
      complianceRate,
      validAcceptances,
      pendingReacceptance,
    }
  }
}

export const complianceService = new ComplianceService()
