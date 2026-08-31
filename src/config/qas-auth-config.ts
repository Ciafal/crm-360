/**
 * QAS AUTH BYPASS — TEMPORARY — MUST NEVER RUN IN PRODUCTION
 *
 * Configuração central e perfis oficiais para o modo de homologação sem login (Auth Bypass QAS)
 * do CRM 360º CIAFAL.
 *
 * Em homologação com bypass ativo (AUTH_BYPASS_ENABLED=true e APP_ENV !== 'production'),
 * a barreira de login/senha/MFA é desativada, permitindo a seleção direta entre os 5 perfis
 * de homologação com seu RBAC correspondente.
 *
 * Para reativar o login real com MFA no futuro, basta alterar AUTH_BYPASS_ENABLED para false.
 */

export interface QASProfile {
  id: string
  buttonText: string
  name: string
  email: string
  role: 'ADMIN' | 'SUPERVISOR' | 'VENDEDOR' | 'REPRESENTANTE_EXTERNO'
  displayRole: string
  employee_id: string
  seller_code: string
  ramal: string
  telefone_corporativo: string
  department: string
  cargo: string
  cost_center: string
  manager_id?: string
  manager_name?: string
  permissions: string[]
  description: string
  restrictions?: string[]
}

/**
 * 5 Perfis Oficiais de Homologação com RBAC completo e estrito
 */
export const QAS_PROFILES: QASProfile[] = [
  {
    id: 'qas-admin_teste',
    buttonText: 'Entrar como Administrador',
    name: 'Carlos Alberto (Diretoria & Adm)',
    email: 'admin.teste@ciafal.local',
    role: 'ADMIN',
    displayRole: 'Administrador',
    employee_id: 'TEST-ADM-01',
    seller_code: 'ADM-TESTE',
    ramal: '4099',
    telefone_corporativo: '(11) 98888-0000',
    department: 'Diretoria & Governança',
    cargo: 'Diretor Comercial / Admin',
    cost_center: 'CC-1000-ADM',
    permissions: [
      'ALL',
      'VIEW_ADMIN',
      'EDIT_GOVERNANCE',
      'VIEW_ALL_SELLERS',
      'VIEW_FULL_STOCK',
      'VIEW_STOCK_COST',
      'VIEW_STOCK_AGING',
      'EXPORT_ALL_DATA',
      'APPROVE_QUOTATIONS',
      'SUPERVISE_TEAM',
    ],
    description:
      'Visão administrativa completa do CRM de homologação, parametrizações e governança.',
  },
  {
    id: 'qas-supervisor_teste',
    buttonText: 'Entrar como Supervisor',
    name: 'Marcos Vinícius (Supervisor)',
    email: 'supervisor.teste@ciafal.local',
    role: 'SUPERVISOR',
    displayRole: 'Supervisor',
    employee_id: 'TEST-SUP-01',
    seller_code: 'SUP-TESTE',
    ramal: '4090',
    telefone_corporativo: '(11) 98888-0001',
    department: 'Supervisão Regional MG/SP',
    cargo: 'Supervisor Regional MG/SP',
    cost_center: 'CC-2000-SUP',
    permissions: [
      'VIEW_TEAM',
      'VIEW_PORTFOLIO',
      'VIEW_PERFORMANCE',
      'VIEW_CRM_360',
      'VIEW_KPIS',
      'MANAGE_GOALS',
      'MANAGE_TASKS',
      'MANAGE_CLIENTS',
      'APPROVE_QUOTATIONS',
      'TRANSFER_CLIENTS',
      'SUPERVISE_ALL_SELLERS',
      'VIEW_STOCK_SUMMARY',
    ],
    description:
      'Equipe, carteira, desempenho, CRM 360º, indicadores, metas, tarefas e cotações da equipe.',
  },
  {
    id: 'qas-vendedor_teste',
    buttonText: 'Entrar como Vendedor 1',
    name: 'Carlos Mendonça',
    email: 'vendedor.teste@ciafal.local',
    role: 'VENDEDOR',
    displayRole: 'Vendedor 1',
    employee_id: 'TEST-VEND-01',
    seller_code: 'VEND-TEST-01',
    ramal: '4091',
    telefone_corporativo: '(11) 98888-0002',
    department: 'Vendas Indústria & Obras',
    cargo: 'Vendedor Sênior - Indústria & Obras',
    cost_center: 'CC-3001-VEND',
    manager_id: 'qas-supervisor_teste',
    manager_name: 'Marcos Vinícius (Supervisor)',
    permissions: [
      'VIEW_OWN_PORTFOLIO',
      'VIEW_OWN_KPIS',
      'CREATE_QUOTATION',
      'VIEW_OWN_TASKS',
      'CONSULT_STOCK_INDIVIDUAL',
      'CREATE_CATALOG',
      'COMMUNICATE_OMNICHANNEL',
    ],
    description:
      'Escopo comercial autorizado para Vendedor Sênior (carteira individual, cotações e consultas individuais).',
    restrictions: [
      'Consulta em massa de estoque PROIBIDA',
      'Estoque total PROIBIDO',
      'Idade de estoque NÃO exibida',
      'Valor financeiro do estoque NÃO exibido',
    ],
  },
  {
    id: 'qas-vendedor2_teste',
    buttonText: 'Entrar como Vendedor 2',
    name: 'Mariana Azevedo',
    email: 'vendedor2.teste@ciafal.local',
    role: 'VENDEDOR',
    displayRole: 'Vendedor 2',
    employee_id: 'TEST-VEND-02',
    seller_code: 'VEND-TEST-02',
    ramal: '4092',
    telefone_corporativo: '(11) 98888-0003',
    department: 'Vendas Construção Civil',
    cargo: 'Vendedora Pleno - Construção Civil',
    cost_center: 'CC-3002-VEND',
    manager_id: 'qas-supervisor_teste',
    manager_name: 'Marcos Vinícius (Supervisor)',
    permissions: [
      'VIEW_OWN_PORTFOLIO',
      'VIEW_OWN_KPIS',
      'CREATE_QUOTATION',
      'VIEW_OWN_TASKS',
      'CONSULT_STOCK_INDIVIDUAL',
      'CREATE_CATALOG',
      'COMMUNICATE_OMNICHANNEL',
    ],
    description:
      'Escopo comercial autorizado para Vendedora Pleno (carteira individual, cotações e consultas individuais).',
    restrictions: [
      'Consulta em massa de estoque PROIBIDA',
      'Estoque total PROIBIDO',
      'Idade de estoque NÃO exibida',
      'Valor financeiro do estoque NÃO exibido',
    ],
  },
  {
    id: 'qas-representante_teste',
    buttonText: 'Entrar como Representante Externo',
    name: 'João Pedro Representações',
    email: 'representante.teste@crm360.local',
    role: 'REPRESENTANTE_EXTERNO',
    displayRole: 'Representante Externo',
    employee_id: 'TEST-REP-01',
    seller_code: 'REP-EXT-01',
    ramal: '4095',
    telefone_corporativo: '(11) 98888-0005',
    department: 'Representação Comercial Externa',
    cargo: 'Representante Comercial Externo',
    cost_center: 'CC-4000-REP',
    manager_id: 'qas-supervisor_teste',
    manager_name: 'Marcos Vinícius (Supervisor)',
    permissions: [
      'VIEW_OWN_EXTERNAL_PORTFOLIO',
      'CREATE_QUOTATION',
      'VIEW_EXTERNAL_CATALOGS',
      'CONSULT_STOCK_INDIVIDUAL',
    ],
    description:
      'Camada comercial mais restritiva, exclusivamente para informações autorizadas ao perfil externo.',
    restrictions: [
      'Apenas carteira e clientes próprios',
      'Acesso a dados administrativos/equipe PROIBIDO',
      'Consulta em massa de estoque PROIBIDA',
      'Estoque total PROIBIDO',
    ],
  },
]

/**
 * Função utilitária para leitura segura de variáveis de ambiente
 */
function getEnv(key: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key]
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return (import.meta.env as any)[key] || (import.meta.env as any)[`VITE_${key}`]
    }
  } catch {
    /* ignore */
  }
  return undefined
}

/**
 * Detecta o ambiente atual do aplicativo (production, homologation, qas, dev)
 */
export function getAppEnvironment(): string {
  const env = (getEnv('APP_ENV') || getEnv('VITE_APP_ENV') || getEnv('NODE_ENV') || 'homologation')
    .toString()
    .trim()
    .toLowerCase()

  if (env === 'prod' || env === 'production') {
    return 'production'
  }
  if (env === 'qas' || env === 'homologacao' || env === 'homologation' || env === 'hml') {
    return 'homologation'
  }
  return env
}

/**
 * Verifica se a feature flag AUTH_BYPASS_ENABLED está ativada.
 * Padrão: true no ambiente de homologação/QAS, a menos que explicitamente configurada como 'false'.
 */
export function isAuthBypassEnabled(): boolean {
  const appEnv = getAppEnvironment()

  const rawBypassFlag = getEnv('AUTH_BYPASS_ENABLED') || getEnv('VITE_AUTH_BYPASS_ENABLED')

  // Se a flag estiver explicitamente configurada
  const isFlagExplicitlySet = rawBypassFlag !== undefined
  const flagValue = isFlagExplicitlySet
    ? rawBypassFlag.toString().trim().toLowerCase() === 'true'
    : true // Padrão é true para homologação / QAS

  // PROTEÇÃO CRÍTICA CONTRA PRODUÇÃO:
  // Se APP_ENV === 'production' E AUTH_BYPASS_ENABLED === true, BLOQUEAR e abortar!
  if (appEnv === 'production') {
    if (flagValue === true) {
      console.error(
        'CRITICAL SECURITY ALERT: AUTH_BYPASS_ENABLED cannot run in PRODUCTION environment! Auth bypass was blocked immediately.',
      )
    }
    return false
  }

  return flagValue
}

/**
 * Retorna true se a sessão atual deve usar o modo de homologação sem login (QAS Auth Bypass)
 */
export function shouldUseQASAuthBypass(): boolean {
  const env = getAppEnvironment()
  const bypass = isAuthBypassEnabled()
  return (
    (env === 'homologation' || env === 'qas' || env === 'dev' || env === 'development') && bypass
  )
}

/**
 * Audit log unificado para sessões e ações de homologação
 */
export function logQASAudit(action: string, details: Record<string, any>): void {
  try {
    const timestamp = new Date().toISOString()
    const logPayload = {
      tag: 'TEST_SESSION / QAS',
      action,
      timestamp,
      environment: 'HOMOLOGAÇÃO',
      ...details,
    }
    // Grava de forma limpa sem expor senhas/secrets
    console.info('[QAS_AUDIT]', JSON.stringify(logPayload))
  } catch {
    /* silent */
  }
}
