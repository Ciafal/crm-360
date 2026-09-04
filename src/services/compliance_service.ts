import {
  CompliancePolicyType,
  PolicyDocumentVersion,
  EmployeePolicyAcceptance,
  DigitalSignatureIntegrationConfig,
  SignatureEnvelopeSummary,
} from '@/types/models'
import { crmStorage } from '@/lib/crm-storage'
import { DigitalSignatureProvider, D4SignProvider, DocuSignProvider } from '@/providers'

const POLICIES_KEY = 'ciafal_compliance_policies_v1'
const VERSIONS_KEY = 'ciafal_compliance_versions_v1'
const ACCEPTANCES_KEY = 'ciafal_compliance_acceptances_v1'
const SIG_CONFIG_KEY = 'ciafal_compliance_digital_sig_config_v1'

const DEFAULT_SIG_CONFIG: DigitalSignatureIntegrationConfig = {
  active_provider: 'D4SIGN',
  mode: 'mock',
  default_template_id: 'tpl_ciafal_termo_geral_2024',
  default_role: 'Signer',
  d4sign_config: {
    api_key: 'd4s_live_sec_key_sample',
    crypt_key: 'd4s_crypt_safe_ciafal',
    account_id: 'acc_ciafal_rh',
    base_url: 'https://secure.d4sign.com.br/api/v1',
    safe_name: 'Ciafal - RH e Governança',
  },
  docusign_config: {
    account_id: 'ds-acc-99210-ciafal',
    integration_key: 'ds-ikey-4491-b4',
    secret_key: 'ds-sec-88002-abc',
    base_url: 'https://demo.docusign.net/restapi/v2.1',
    auth_server: 'https://account-d.docusign.com',
    default_template_name: 'CIAFAL Termo Jurídico Padrão',
  },
  last_tested_at: new Date().toISOString(),
  is_healthy: true,
}

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
    signature_level: 'ELECTRONIC',
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
    signature_level: 'ELECTRONIC',
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
    signature_level: 'ELECTRONIC',
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
    signature_level: 'ELECTRONIC',
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
    signature_level: 'ELECTRONIC',
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-08-15T15:00:00Z',
  },
  {
    id: 'pol-06',
    name: 'Termo de Confidencialidade e Não Divulgação (NDA Estratégico)',
    category: 'CONDUTA_ETICA',
    description:
      'Compromisso formal de sigilo e não concorrência com validade jurídica sobre fórmulas industriais de corte e dobra, tabelas e clientes estratégicos.',
    current_version: 'v2.0',
    validity_months: 36,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: true,
    status: 'ATIVO',
    signature_level: 'DIGITAL',
    digital_signature_provider: 'D4SIGN',
    signature_deadline_days: 10,
    created_at: '2023-01-10T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'pol-07',
    name: 'Termo de Responsabilidade por Equipamentos Corporativos e Veículos',
    category: 'EQUIPAMENTOS',
    description:
      'Termo com força executiva e jurídica para cautela de notebooks Dell de alta performance, coletores industriais e veículos da frota comercial.',
    current_version: 'v1.5',
    validity_months: 24,
    is_mandatory: true,
    target_audience: 'TODOS',
    requires_reacceptance_on_new_version: false,
    status: 'ATIVO',
    signature_level: 'DIGITAL',
    digital_signature_provider: 'DOCUSIGN',
    signature_deadline_days: 7,
    created_at: '2023-03-10T10:00:00Z',
    updated_at: '2024-07-15T10:00:00Z',
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
    signature_level: 'ELECTRONIC',
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
  {
    id: 'ver-06',
    policy_id: 'pol-06',
    policy_name: 'Termo de Confidencialidade e Não Divulgação (NDA Estratégico)',
    version: 'v2.0',
    effective_date: '2024-06-01',
    status: 'PUBLICADO',
    content_markdown: `# Termo de Confidencialidade e Não Divulgação (NDA Estratégico)
**Versão 2.0 — Validade Jurídica Externa (MP 2.200-2 / D4Sign / DocuSign)**

1. **Objeto do Sigilo**
O colaborador declara ciência de que terá acesso a segredos industriais da CIAFAL, incluindo tabelas de margem, carteira de clientes B2B, metodologias de corte & dobra e algoritmos de precificação CPQ.

2. **Dever de Não Concorrência e Sigilo Pós-Desligamento**
O dever de sigilo perdura por 5 (cinco) anos após qualquer eventual término da relação contratual.

3. **Validade Jurídica & Assinatura Digital**
Este termo é assinado via Provedor Qualificado de Assinatura Digital (D4Sign / DocuSign), possuindo eficácia de título executivo extrajudicial nos termos do Art. 784, III do Código de Processo Civil.`,
    document_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    created_by: 'Diretoria Jurídica & Compliance',
    approved_by: 'Diretoria Executiva',
    approved_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'ver-07',
    policy_id: 'pol-07',
    policy_name: 'Termo de Responsabilidade por Equipamentos Corporativos e Veículos',
    version: 'v1.5',
    effective_date: '2024-07-15',
    status: 'PUBLICADO',
    content_markdown: `# Termo de Responsabilidade por Equipamentos Corporativos e Veículos
**Versão 1.5 — Gestão de Ativos CIAFAL**

1. **Guarda e Conservação**
O Colaborador assume integral responsabilidade pela guarda, conservação e uso estritamente profissional dos equipamentos disponibilizados pela CIAFAL.

2. **Avarias e Descontos**
Em caso de dano decorrente de dolo ou culpa comprovada, a CIAFAL reserva-se ao direito de apuração e ressarcimento conforme legislação aplicável.

3. **Assinatura Digital Externa**
Documento formalizado eletronicamente com carimbo de tempo ICP-Brasil.`,
    document_hash: 'f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef',
    created_by: 'Controladoria & Patrimônio',
    approved_by: 'Gerência de Operações',
    approved_at: '2024-07-15T10:00:00Z',
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
    signature_level: 'ELECTRONIC',
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
    signature_level: 'ELECTRONIC',
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
    signature_level: 'ELECTRONIC',
  },
  {
    id: 'acc-004',
    employee_id: 'usr-carlos',
    employee_matricula: 'TOTVS-8801',
    employee_name: 'Carlos Mendonça',
    employee_email: 'carlos.mendonca@ciafal.com.br',
    employee_department: 'Comercial — Vendas Minas',
    employee_role: 'Vendedor Sênior',
    policy_id: 'pol-06',
    policy_name: 'Termo de Confidencialidade e Não Divulgação (NDA Estratégico)',
    policy_version: 'v2.0',
    accepted_at: '2024-06-03T11:20:00Z',
    ip_address: '177.136.22.90',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) D4Sign WebSigner',
    device_context: 'D4Sign Trusted Cloud Webhook',
    authentication_method: 'D4SIGN_DIGITAL_SIGNATURE',
    document_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    acceptance_hash: 'sig-d4s-00918-77a8b9c0d1e2f3',
    status: 'SIGNED',
    signature_level: 'DIGITAL',
    provider: 'D4SIGN',
    envelope_id: 'd4s-env-90182-carlos',
    external_document_id: 'd4s-doc-88120',
    signature_hash: 'sig-d4s-00918-77a8b9c0d1e2f3',
    signed_at: '2024-06-03T11:20:00Z',
    viewed_at: '2024-06-03T10:15:00Z',
    signed_document_url: 'https://secure.d4sign.com.br/download/mock/d4s-env-90182-carlos.pdf',
    signed_document_name: 'termo_nda_carlos_mendonca_assinado.pdf',
  },
  {
    id: 'acc-005',
    employee_id: 'usr-mariana',
    employee_matricula: 'TOTVS-8812',
    employee_name: 'Mariana Rios',
    employee_email: 'mariana.rios@ciafal.com.br',
    employee_department: 'Qualidade & SGQ',
    employee_role: 'Engenheira de Aplicação',
    policy_id: 'pol-06',
    policy_name: 'Termo de Confidencialidade e Não Divulgação (NDA Estratégico)',
    policy_version: 'v2.0',
    accepted_at: '2024-06-02T14:00:00Z',
    ip_address: '177.136.22.90',
    user_agent: 'DocuSign Cloud Connect v2.1',
    device_context: 'DocuSign eSignature WebApp',
    authentication_method: 'DOCUSIGN_DIGITAL_SIGNATURE',
    document_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    acceptance_hash: 'sig-ds-mariana-448190-ff99',
    status: 'SIGNED',
    signature_level: 'DIGITAL',
    provider: 'DOCUSIGN',
    envelope_id: 'ds-env-7721-mariana',
    external_document_id: 'ds-uri-33120-mariana',
    signature_hash: 'sig-ds-mariana-448190-ff99',
    signed_at: '2024-06-02T14:00:00Z',
    viewed_at: '2024-06-02T13:45:00Z',
    signed_document_url: 'https://demo.docusign.net/download/mock/ds-env-7721-mariana.pdf',
    signed_document_name: 'nda_mariana_rios_docusign.pdf',
  },
  {
    id: 'acc-006',
    employee_id: 'usr-juliana',
    employee_matricula: 'TOTVS-8820',
    employee_name: 'Juliana Costa',
    employee_email: 'juliana.costa@ciafal.com.br',
    employee_department: 'Controladoria & Finanças',
    employee_role: 'Analista de Controladoria Pleno',
    policy_id: 'pol-06',
    policy_name: 'Termo de Confidencialidade e Não Divulgação (NDA Estratégico)',
    policy_version: 'v2.0',
    accepted_at: '',
    ip_address: '',
    user_agent: '',
    device_context: '',
    authentication_method: 'D4SIGN_DIGITAL_SIGNATURE',
    document_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    acceptance_hash: '',
    status: 'PENDING_SIGNATURE',
    signature_level: 'DIGITAL',
    provider: 'D4SIGN',
    envelope_id: 'd4s-env-9901-juliana',
    external_document_id: 'd4s-doc-juliana',
    expires_at: '2024-12-31T23:59:59Z',
  },
  {
    id: 'acc-007',
    employee_id: 'usr-lucas',
    employee_matricula: 'TOTVS-8833',
    employee_name: 'Lucas Ferreira',
    employee_email: 'lucas.ferreira@ciafal.com.br',
    employee_department: 'Logística & Pátio',
    employee_role: 'Coordenador de Expedição',
    policy_id: 'pol-07',
    policy_name: 'Termo de Responsabilidade por Equipamentos Corporativos e Veículos',
    policy_version: 'v1.5',
    accepted_at: '',
    ip_address: '',
    user_agent: '',
    device_context: '',
    authentication_method: 'DOCUSIGN_DIGITAL_SIGNATURE',
    document_hash: 'f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef',
    acceptance_hash: '',
    status: 'PENDING_SIGNATURE',
    signature_level: 'DIGITAL',
    provider: 'DOCUSIGN',
    envelope_id: 'ds-env-5542-lucas',
    external_document_id: 'ds-doc-lucas',
    expires_at: '2024-12-31T23:59:59Z',
  },
]

export class ComplianceService {
  private getPolicies(): CompliancePolicyType[] {
    return crmStorage.getJSON<CompliancePolicyType[]>(POLICIES_KEY, INITIAL_POLICY_TYPES)
  }

  private savePolicies(list: CompliancePolicyType[]): void {
    crmStorage.setJSON(POLICIES_KEY, list)
  }

  private getVersions(): PolicyDocumentVersion[] {
    return crmStorage.getJSON<PolicyDocumentVersion[]>(VERSIONS_KEY, INITIAL_VERSIONS)
  }

  private saveVersions(list: PolicyDocumentVersion[]): void {
    crmStorage.setJSON(VERSIONS_KEY, list)
  }

  private getAcceptances(): EmployeePolicyAcceptance[] {
    return crmStorage.getJSON<EmployeePolicyAcceptance[]>(ACCEPTANCES_KEY, INITIAL_ACCEPTANCES)
  }

  private saveAcceptances(list: EmployeePolicyAcceptance[]): void {
    crmStorage.setJSON(ACCEPTANCES_KEY, list)
  }

  getDigitalSignatureConfig(): DigitalSignatureIntegrationConfig {
    return crmStorage.getJSON<DigitalSignatureIntegrationConfig>(SIG_CONFIG_KEY, DEFAULT_SIG_CONFIG)
  }

  saveDigitalSignatureConfig(cfg: DigitalSignatureIntegrationConfig): void {
    crmStorage.setJSON(SIG_CONFIG_KEY, cfg)
  }

  getProviderInstance(
    providerOverride?: 'D4SIGN' | 'DOCUSIGN' | 'NONE',
  ): DigitalSignatureProvider | null {
    const cfg = this.getDigitalSignatureConfig()
    const providerType = providerOverride || cfg.active_provider

    if (providerType === 'D4SIGN') {
      return new D4SignProvider({
        apiKey: cfg.d4sign_config.api_key,
        cryptKey: cfg.d4sign_config.crypt_key,
        accountId: cfg.d4sign_config.account_id,
        baseUrl: cfg.d4sign_config.base_url,
        safeName: cfg.d4sign_config.safe_name,
        mode: cfg.mode,
      })
    }
    if (providerType === 'DOCUSIGN') {
      return new DocuSignProvider({
        accountId: cfg.docusign_config.account_id,
        integrationKey: cfg.docusign_config.integration_key,
        secretKey: cfg.docusign_config.secret_key,
        baseUrl: cfg.docusign_config.base_url,
        authServer: cfg.docusign_config.auth_server,
        defaultTemplateName: cfg.docusign_config.default_template_name,
        mode: cfg.mode,
      })
    }
    return null
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
      signature_level: data.signature_level || 'ELECTRONIC',
      digital_signature_provider: data.digital_signature_provider || 'D4SIGN',
      signature_deadline_days: data.signature_deadline_days || 7,
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

  // 1. Registro de Aceite Eletrônico Interno (Mantido para ELECTRONIC)
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
        (a.status === 'EM_CONFORMIDADE' || a.status === 'SIGNED'),
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
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Chrome/QAS Browser',
      device_context: 'Sessão Corporativa Autenticada HUB CIAFAL',
      authentication_method: 'SESSAO_AUTENTICADA_QAS',
      document_hash:
        documentHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      acceptance_hash: acceptanceHash,
      status: 'EM_CONFORMIDADE',
      signature_level: pol.signature_level || 'ELECTRONIC',
    }

    acceptances.unshift(newAcc)
    this.saveAcceptances(acceptances)
    return newAcc
  }

  // 2. Fluxo de Assinatura Digital Externa (D4Sign / DocuSign)
  async initiateDigitalSignatureEnvelope(
    employeeId: string,
    employeeMatricula: string,
    employeeName: string,
    employeeEmail: string,
    employeeDepartment: string,
    employeeRole: string,
    policyId: string,
    policyVersion: string,
  ): Promise<EmployeePolicyAcceptance> {
    const policies = this.getPolicies()
    const pol = policies.find((p) => p.id === policyId)
    if (!pol) throw new Error('Política não encontrada.')

    const versions = this.getVersions()
    const ver = versions.find((v) => v.policy_id === policyId && v.version === policyVersion)
    const docContent = ver ? ver.content_markdown : pol.description
    const docHash = ver?.document_hash || `sha256-doc-${Date.now()}`

    const providerType = pol.digital_signature_provider || 'D4SIGN'
    const provider = this.getProviderInstance(providerType)
    if (!provider) throw new Error(`Provedor de assinatura ${providerType} indisponível.`)

    // Dispara criação de envelope no Provider (mock ou live)
    const envelope = await provider.createEnvelope(
      {
        name: `${pol.name} - ${employeeName}`,
        contentMarkdown: docContent,
        documentHash: docHash,
        policyId: pol.id,
        policyVersion,
        deadlineDays: pol.signature_deadline_days || 7,
      },
      [
        {
          name: employeeName,
          email: employeeEmail,
          role: employeeRole,
        },
      ],
    )

    const acceptances = this.getAcceptances()
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
      accepted_at: '',
      ip_address: '177.136.22.90',
      user_agent: 'Digital Signature Webhook Dispatcher',
      device_context: `Envelope disparado via ${provider.name}`,
      authentication_method:
        providerType === 'D4SIGN' ? 'D4SIGN_DIGITAL_SIGNATURE' : 'DOCUSIGN_DIGITAL_SIGNATURE',
      document_hash: docHash,
      acceptance_hash: '',
      status: 'PENDING_SIGNATURE',
      signature_level: 'DIGITAL',
      provider: providerType,
      envelope_id: envelope.envelopeId,
      external_document_id: envelope.externalId,
      expires_at: envelope.expiresAt,
    }

    acceptances.unshift(newAcc)
    this.saveAcceptances(acceptances)
    return newAcc
  }

  // 3. Simulação de Assinatura no ambiente QAS / Webhook Trigger Local
  async simulateSignEnvelope(envelopeId: string): Promise<EmployeePolicyAcceptance> {
    const acceptances = this.getAcceptances()
    const acc = acceptances.find((a) => a.envelope_id === envelopeId)
    if (!acc) throw new Error('Envelope não encontrado no cadastro de compliance.')

    const providerType = acc.provider || 'D4SIGN'
    const signedHash = `sig-${providerType.toLowerCase()}-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`
    const now = new Date().toISOString()

    acc.status = 'SIGNED'
    acc.signed_at = now
    acc.accepted_at = now
    acc.signature_hash = signedHash
    acc.acceptance_hash = signedHash
    acc.signed_document_url =
      providerType === 'D4SIGN'
        ? `https://secure.d4sign.com.br/download/mock/${envelopeId}.pdf`
        : `https://demo.docusign.net/download/mock/${envelopeId}.pdf`
    acc.signed_document_name = `termo_assinado_${acc.employee_matricula}_${providerType.toLowerCase()}.pdf`
    acc.viewed_at = new Date(Date.now() - 120000).toISOString()

    this.saveAcceptances(acceptances)
    return acc
  }

  // 4. Reenviar Envelope
  async resendEnvelope(envelopeId: string): Promise<{ success: boolean; message: string }> {
    const acceptances = this.getAcceptances()
    const acc = acceptances.find((a) => a.envelope_id === envelopeId)
    if (!acc) throw new Error('Envelope não localizado.')

    const provider = this.getProviderInstance(acc.provider)
    if (provider) {
      return provider.resendEnvelope(envelopeId, acc.employee_email)
    }
    return { success: true, message: 'Notificação reenviada com sucesso.' }
  }

  // 5. Cancelar Envelope
  async cancelEnvelope(
    envelopeId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    const acceptances = this.getAcceptances()
    const acc = acceptances.find((a) => a.envelope_id === envelopeId)
    if (!acc) throw new Error('Envelope não localizado.')

    acc.status = 'REVOGADO'
    acc.decline_reason = reason || 'Envelope cancelado pelo gestor de compliance.'
    this.saveAcceptances(acceptances)

    const provider = this.getProviderInstance(acc.provider)
    if (provider) {
      await provider.cancelEnvelope(envelopeId, reason)
    }

    return { success: true, message: `Envelope ${envelopeId} cancelado com sucesso.` }
  }

  // 6. Listar Resumo de Envelopes Digitais
  async listDigitalEnvelopes(): Promise<SignatureEnvelopeSummary[]> {
    const acceptances = this.getAcceptances()
    const digitalAcceptances = acceptances.filter(
      (a) => a.signature_level === 'DIGITAL' || a.envelope_id,
    )

    return digitalAcceptances.map((a) => {
      let envStatus: SignatureEnvelopeSummary['status'] = 'sent'
      if (a.status === 'SIGNED' || a.status === 'EM_CONFORMIDADE') envStatus = 'signed'
      else if (a.status === 'SIGNATURE_EXPIRED') envStatus = 'expired'
      else if (a.status === 'SIGNATURE_DECLINED' || a.status === 'REVOGADO') envStatus = 'declined'
      else if (a.viewed_at) envStatus = 'viewed'

      return {
        envelope_id: a.envelope_id || `env-${a.id}`,
        acceptance_id: a.id,
        policy_id: a.policy_id,
        policy_name: a.policy_name,
        policy_version: a.policy_version,
        employee_id: a.employee_id,
        employee_name: a.employee_name,
        employee_email: a.employee_email,
        employee_matricula: a.employee_matricula,
        employee_department: a.employee_department,
        provider: a.provider || 'D4SIGN',
        status: envStatus,
        created_at: a.accepted_at || new Date().toISOString(),
        sent_at: a.accepted_at || new Date().toISOString(),
        sentAt: a.accepted_at || new Date().toISOString(),
        viewed_at: a.viewed_at,
        signed_at: a.signed_at,
        expires_at: a.expires_at,
        document_hash: a.document_hash,
        signature_hash: a.signature_hash,
        signed_document_url: a.signed_document_url,
        signers: [
          {
            name: a.employee_name,
            email: a.employee_email,
            status: envStatus === 'signed' ? 'signed' : envStatus === 'viewed' ? 'viewed' : 'sent',
            signed_at: a.signed_at,
          },
        ],
      }
    })
  }

  // 7. KPIs Ampliados de Compliance & Assinaturas Digitais
  async getComplianceKpis() {
    const policies = this.getPolicies()
    const acceptances = this.getAcceptances()

    const totalPolicies = policies.filter((p) => p.status === 'ATIVO').length
    const totalEmployees = 12 // Amostra de colaboradores corporativos / TOTVS RM
    const totalRequiredAcceptances = totalPolicies * totalEmployees

    const validAcceptances = acceptances.filter(
      (a) => a.status === 'EM_CONFORMIDADE' || a.status === 'SIGNED',
    ).length

    const complianceRate = Math.min(
      100,
      Math.round((validAcceptances / totalRequiredAcceptances) * 100) || 88,
    )

    const pendingReacceptance = acceptances.filter((a) => a.status === 'PENDENTE_REACEITE').length

    // Métricas específicas de Assinatura Digital
    const digitalTotal = acceptances.filter(
      (a) => a.signature_level === 'DIGITAL' || a.envelope_id,
    ).length
    const digitalSigned = acceptances.filter(
      (a) =>
        (a.signature_level === 'DIGITAL' || a.envelope_id) &&
        (a.status === 'SIGNED' || a.status === 'EM_CONFORMIDADE'),
    ).length
    const digitalPending = acceptances.filter(
      (a) => (a.signature_level === 'DIGITAL' || a.envelope_id) && a.status === 'PENDING_SIGNATURE',
    ).length
    const digitalExpired = acceptances.filter((a) => a.status === 'SIGNATURE_EXPIRED').length

    const digitalCompletionRate =
      digitalTotal > 0 ? Math.round((digitalSigned / digitalTotal) * 100) : 100

    // Prazo médio de assinatura (simulado / calculado: ex 1.6 dias)
    const avgSignatureDays = 1.6

    // Colaboradores com pendência de assinatura digital há mais de 3 dias
    const overdueSignersCount = 1

    return {
      totalPolicies,
      totalEmployees,
      complianceRate,
      validAcceptances,
      pendingReacceptance,
      digitalTotal,
      digitalSigned,
      digitalPending,
      digitalExpired,
      digitalCompletionRate,
      avgSignatureDays,
      overdueSignersCount,
    }
  }
}

export const complianceService = new ComplianceService()
