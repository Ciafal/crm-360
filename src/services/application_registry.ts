import {
  TrendingUp,
  Target,
  Rocket,
  Lightbulb,
  BarChart3,
  Users2,
  Truck,
  Warehouse,
  ShoppingBag,
  Cpu,
  Wrench,
  Gauge,
  Factory,
  Cog,
  ShieldCheck,
  UserCheck,
  FileText,
  Award,
  HardHat,
  Scale,
  Bot,
  KeyRound,
  Database,
  Calendar,
  MessageSquare,
  Sparkles,
  Layers,
  Settings,
  LifeBuoy,
  Zap,
} from 'lucide-react'

export type HubCategory =
  | 'GESTAO_ESTRATEGIA'
  | 'COMERCIAL_LOGISTICA'
  | 'OPERACOES_INDUSTRIAIS'
  | 'PESSOAS_GOVERNANCA'
  | 'DADOS_ATIVOS'

export type ModuleStatus = 'ATIVO' | 'INTEGRADO' | 'EM_HOMOLOGACAO' | 'PLANEJADO'

export interface HubSubItem {
  id: string
  name: string
  path: string
  description?: string
  status?: ModuleStatus
}

export interface HubModule {
  id: string
  name: string
  shortName?: string
  category: HubCategory
  categoryLabel: string
  icon: any
  path: string
  description: string
  status: ModuleStatus
  isNew?: boolean
  badge?: string
  subItems?: HubSubItem[]
  rolesAllowed?: string[]
}

export const HUB_CATEGORIES: { id: HubCategory; label: string; description: string }[] = [
  {
    id: 'GESTAO_ESTRATEGIA',
    label: 'Gestão & Estratégia',
    description: 'Planejamento estratégico, KPIs corporativos, metas e inovação',
  },
  {
    id: 'COMERCIAL_LOGISTICA',
    label: 'Comercial & Logística',
    description: 'CRM 360º, gestão de carteira, transporte, armazenagem e compras',
  },
  {
    id: 'OPERACOES_INDUSTRIAIS',
    label: 'Operações Industriais',
    description: 'PCP, manutenção fabril, automação, chão de fábrica e controle de qualidade',
  },
  {
    id: 'PESSOAS_GOVERNANCA',
    label: 'Pessoas & Governança',
    description: 'Capital humano, solicitações transversais, segurança, SSMA e inteligência',
  },
  {
    id: 'DADOS_ATIVOS',
    label: 'Dados & Ativos',
    description: 'Infraestrutura de dados mestre, engenharia de ativos e inventário corporativo',
  },
]

export const HUB_APPLICATION_REGISTRY: HubModule[] = [
  // ==========================================
  // 1. GESTÃO & ESTRATÉGIA
  // ==========================================
  {
    id: 'gestao-performance',
    name: 'Gestão de Performance',
    shortName: 'Performance',
    category: 'GESTAO_ESTRATEGIA',
    categoryLabel: 'Gestão & Estratégia',
    icon: TrendingUp,
    path: '/gestao-do-dia',
    description: 'Painel executivo de performance diária, ritmo de vendas, aderência e forecast.',
    status: 'ATIVO',
  },
  {
    id: 'plano-metas',
    name: 'Plano de Metas',
    shortName: 'Metas',
    category: 'GESTAO_ESTRATEGIA',
    categoryLabel: 'Gestão & Estratégia',
    icon: Target,
    path: '/importar-pe',
    description:
      'Planejamento Estratégico com template oficial Excel em 10 abas e staging auditável.',
    status: 'ATIVO',
    badge: 'Staging PE',
  },
  {
    id: 'gump',
    name: 'GUMP',
    shortName: 'GUMP',
    category: 'GESTAO_ESTRATEGIA',
    categoryLabel: 'Gestão & Estratégia',
    icon: Rocket,
    path: '/gestao-do-dia?tab=gump',
    description:
      'Gestão Unificada de Metas e Produtividade com acompanhamento de entregas de alto impacto.',
    status: 'INTEGRADO',
  },
  {
    id: 'programa-ideias',
    name: 'Programa de Ideias / Inovação',
    shortName: 'Inovação',
    category: 'GESTAO_ESTRATEGIA',
    categoryLabel: 'Gestão & Estratégia',
    icon: Lightbulb,
    path: '/solicitacoes?tipo=TREINAMENTO_INTERNO&origem=ideias',
    description:
      'Submissão de sugestões de melhoria contínua, inovação industrial e eficiência comercial.',
    status: 'INTEGRADO',
  },
  {
    id: 'kpis-comerciais',
    name: 'KPIs Comerciais',
    shortName: 'KPIs Comerciais',
    category: 'GESTAO_ESTRATEGIA',
    categoryLabel: 'Gestão & Estratégia',
    icon: BarChart3,
    path: '/kpis-comerciais',
    description:
      'Cockpit de métricas em dois níveis (Vendedor vs Gestão) com indicador OIF e realizada x meta.',
    status: 'ATIVO',
    isNew: true,
    badge: 'Novo',
  },

  // ==========================================
  // 2. COMERCIAL & LOGÍSTICA
  // ==========================================
  {
    id: 'crm',
    name: 'CRM 360º',
    shortName: 'CRM',
    category: 'COMERCIAL_LOGISTICA',
    categoryLabel: 'Comercial & Logística',
    icon: Users2,
    path: '/crm',
    description: 'Gestão de carteira 360º, funil de vendas, seletor de Toneladas/Valor e visitas.',
    status: 'ATIVO',
    subItems: [
      { id: 'crm-pipeline', name: 'Pipeline & Funil', path: '/crm' },
      { id: 'crm-cotacoes', name: 'Cotações & Estoque SAP', path: '/crm?tab=cotacoes' },
      { id: 'crm-nova-cotacao', name: '+ Nova Cotação', path: '/crm/cotacoes/nova' },
      { id: 'crm-sap-queue', name: 'Fila de Pedidos SAP', path: '/crm/integracoes/sap/pedidos' },
      { id: 'crm-meu-dia', name: 'Meu Dia / Ações', path: '/home' },
      { id: 'crm-contatos', name: 'Contatos & Interações', path: '/contatos' },
      { id: 'crm-inativos', name: 'Gestão de Inativos', path: '/inativos' },
      { id: 'crm-visitas', name: 'Visitas & Roteiros', path: '/visitas' },
      { id: 'crm-tarefas', name: 'Central de Tarefas', path: '/tarefas' },
      { id: 'crm-equipe', name: 'Equipe Comercial', path: '/equipe' },
      { id: 'crm-conversas', name: 'Conversas & WhatsApp', path: '/conversas' },
    ],
  },
  {
    id: 'tms',
    name: 'TMS',
    shortName: 'TMS',
    category: 'COMERCIAL_LOGISTICA',
    categoryLabel: 'Comercial & Logística',
    icon: Truck,
    path: '/central-integracoes?connector=tms-transporte',
    description:
      'Sistema de Gerenciamento de Transportes: rastreamento de cargas em trânsito e ocorrências SEFAZ.',
    status: 'INTEGRADO',
  },
  {
    id: 'wms',
    name: 'WMS',
    shortName: 'WMS',
    category: 'COMERCIAL_LOGISTICA',
    categoryLabel: 'Comercial & Logística',
    icon: Warehouse,
    path: '/central-integracoes?connector=sap-ecc&modulo=wms',
    description:
      'Armazenagem, controle de estoques em pátio fabril, recebimento e expedição CD Contagem.',
    status: 'INTEGRADO',
  },
  {
    id: 'srm',
    name: 'SRM / E-Procurement',
    shortName: 'SRM',
    category: 'COMERCIAL_LOGISTICA',
    categoryLabel: 'Comercial & Logística',
    icon: ShoppingBag,
    path: '/solicitacoes?tipo=VISITA_FORNECEDOR',
    description:
      'Gestão de relacionamento com fornecedores, cotações de compras e homologação de usinas.',
    status: 'INTEGRADO',
  },

  // ==========================================
  // 3. OPERAÇÕES INDUSTRIAIS
  // ==========================================
  {
    id: 'pcp',
    name: 'PCP',
    shortName: 'PCP',
    category: 'OPERACOES_INDUSTRIAIS',
    categoryLabel: 'Operações Industriais',
    icon: Cpu,
    path: '/central-integracoes?modulo=pcp',
    description:
      'Planejamento e Controle da Produção siderúrgica, sequenciamento de corte e bobinas.',
    status: 'INTEGRADO',
  },
  {
    id: 'pcm',
    name: 'PCM / CMMS',
    shortName: 'PCM',
    category: 'OPERACOES_INDUSTRIAIS',
    categoryLabel: 'Operações Industriais',
    icon: Wrench,
    path: '/central-integracoes?modulo=pcm',
    description:
      'Planejamento e Controle de Manutenção de pontes rolantes, perfiladeiras e carretas.',
    status: 'INTEGRADO',
  },
  {
    id: 'aom',
    name: 'AOM',
    shortName: 'AOM',
    category: 'OPERACOES_INDUSTRIAIS',
    categoryLabel: 'Operações Industriais',
    icon: Gauge,
    path: '/central-integracoes?modulo=aom',
    description:
      'Automação e Otimização de Manufatura com monitoramento em tempo real dos sensores de linha.',
    status: 'INTEGRADO',
  },
  {
    id: 'mes',
    name: 'MES 4.0',
    shortName: 'MES 4.0',
    category: 'OPERACOES_INDUSTRIAIS',
    categoryLabel: 'Operações Industriais',
    icon: Factory,
    path: '/central-integracoes?modulo=mes',
    description:
      'Manufacturing Execution System para coleta de dados de apontamento no chão de fábrica.',
    status: 'INTEGRADO',
  },
  {
    id: 'mom',
    name: 'MOM',
    shortName: 'MOM',
    category: 'OPERACOES_INDUSTRIAIS',
    categoryLabel: 'Operações Industriais',
    icon: Cog,
    path: '/central-integracoes?modulo=mom',
    description:
      'Manufacturing Operations Management integrando qualidade, estoque em processo e tempos padrão.',
    status: 'INTEGRADO',
  },
  {
    id: 'qualidade-produto',
    name: 'Qualidade do Produto',
    shortName: 'Qualidade',
    category: 'OPERACOES_INDUSTRIAIS',
    categoryLabel: 'Operações Industriais',
    icon: ShieldCheck,
    path: '/hcm?tab=politicas&categoria=QUALIDADE',
    description:
      'Controle de certificados de usina, inspeção dimensional, tolerâncias mecânicas e laudos.',
    status: 'ATIVO',
  },

  // ==========================================
  // 4. PESSOAS & GOVERNANÇA
  // ==========================================
  {
    id: 'hcm',
    name: 'HCM',
    shortName: 'HCM',
    category: 'PESSOAS_GOVERNANCA',
    categoryLabel: 'Pessoas & Governança',
    icon: UserCheck,
    path: '/hcm',
    description:
      'Gestão de Capital Humano com governança, termos, políticas e aceites eletrônicos imutáveis.',
    status: 'ATIVO',
    subItems: [
      { id: 'hcm-recrutamento', name: 'Recrutamento & Seleção', path: '/hcm?sub=recrutamento' },
      {
        id: 'hcm-treinamentos',
        name: 'Treinamentos',
        path: '/solicitacoes?tipo=TREINAMENTO_INTERNO',
      },
      { id: 'hcm-desempenho', name: 'Avaliação de Desempenho', path: '/hcm?sub=desempenho' },
      { id: 'hcm-compliance', name: 'Governança & Compliance', path: '/hcm' },
    ],
  },
  {
    id: 'solicitacoes',
    name: 'Solicitações Corporativas',
    shortName: 'Solicitações',
    category: 'PESSOAS_GOVERNANCA',
    categoryLabel: 'Pessoas & Governança',
    icon: FileText,
    path: '/solicitacoes',
    description:
      'Central unificada para Viagens, Treinamentos, Visitas Técnicas, Fornecedores e Reembolsos.',
    status: 'ATIVO',
    isNew: true,
    badge: 'Novo',
  },
  {
    id: 'sgq',
    name: 'SGQ',
    shortName: 'SGQ',
    category: 'PESSOAS_GOVERNANCA',
    categoryLabel: 'Pessoas & Governança',
    icon: Award,
    path: '/hcm?tab=termos&filtro=SGQ',
    description:
      'Sistema de Gestão da Qualidade: normas ISO 9001, auditorias internas e não conformidades.',
    status: 'ATIVO',
  },
  {
    id: 'ehs',
    name: 'EHS / SSMA',
    shortName: 'EHS / SSMA',
    category: 'PESSOAS_GOVERNANCA',
    categoryLabel: 'Pessoas & Governança',
    icon: HardHat,
    path: '/hcm?tab=termos&filtro=SSMA',
    description:
      'Saúde, Segurança do Trabalho e Meio Ambiente (EPIs, APRs, CIPA e auditorias de campo).',
    status: 'ATIVO',
  },
  {
    id: 'icm',
    name: 'ICM',
    shortName: 'ICM',
    category: 'PESSOAS_GOVERNANCA',
    categoryLabel: 'Pessoas & Governança',
    icon: Scale,
    path: '/hcm?tab=aceites',
    description: 'Internal Control & Compliance Management com trilha imutável SHA-256 de aceites.',
    status: 'ATIVO',
  },
  {
    id: 'agentes',
    name: 'Agentes',
    shortName: 'Agentes',
    category: 'PESSOAS_GOVERNANCA',
    categoryLabel: 'Pessoas & Governança',
    icon: Bot,
    path: '/agentes',
    description:
      'Assistentes virtuais de IA treinados na inteligência de vendas, regras de negócio e CRM.',
    status: 'ATIVO',
  },
  {
    id: 'controle-acessos',
    name: 'Controle de Acessos',
    shortName: 'Acessos & Admin',
    category: 'PESSOAS_GOVERNANCA',
    categoryLabel: 'Pessoas & Governança',
    icon: KeyRound,
    path: '/administracao',
    description:
      'Matriz RBAC, usuários de teste, playbooks comerciais, regras de automação e MFA OTP.',
    status: 'ATIVO',
  },

  // ==========================================
  // 5. DADOS & ATIVOS
  // ==========================================
  {
    id: 'ims',
    name: 'IMS',
    shortName: 'IMS',
    category: 'DADOS_ATIVOS',
    categoryLabel: 'Dados & Ativos',
    icon: Database,
    path: '/central-integracoes',
    description:
      'Information Management System: governança dos dados mestres de clientes, materiais e conectores.',
    status: 'ATIVO',
    subItems: [
      { id: 'ims-conectores', name: 'Central de Integrações', path: '/central-integracoes' },
      { id: 'ims-hypercare', name: 'Cockpit Hypercare', path: '/hypercare' },
      { id: 'ims-release', name: 'Relatório da Release', path: '/relatorio-release' },
    ],
  },
]

export function getModulesByCategory(category: HubCategory): HubModule[] {
  return HUB_APPLICATION_REGISTRY.filter((mod) => mod.category === category)
}

export function findModuleByPath(pathname: string): HubModule | undefined {
  return HUB_APPLICATION_REGISTRY.find(
    (mod) =>
      mod.path === pathname ||
      mod.subItems?.some((sub) => sub.path === pathname || pathname.startsWith(sub.path)),
  )
}
