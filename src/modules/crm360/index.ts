// src/modules/crm360/index.ts
// Contrato oficial do módulo CRM 360º CIAFAL para consumo interno e pelo futuro HUB

export interface CrmMenuItem {
  id: string
  name: string
  path: string
  badge?: string
  badgeType?: 'auto' | 'ia' | 'omni' | string
  priority?: number
  desc?: string
}

/**
 * Itens do Menu Principal do CRM 360 CIAFAL (prefixados com /crm360)
 */
export const CRM_MAIN_NAV_ITEMS: CrmMenuItem[] = [
  { id: 'meu-dia', name: 'Meu Dia', path: '/crm360/home', priority: 1 },
  {
    id: 'contatos',
    name: 'Contatos',
    path: '/crm360/contatos',
    badge: 'Omnichannel',
    badgeType: 'omni',
    priority: 2,
  },
  { id: 'cotacoes', name: 'Cotações', path: '/crm360/cotacoes', priority: 3 },
  { id: 'crm', name: 'CRM 360', path: '/crm360/crm', priority: 4 },
  { id: 'tarefas', name: 'Tarefas', path: '/crm360/tarefas', priority: 5 },
  { id: 'kpis', name: 'KPIs', path: '/crm360/kpis', priority: 6 },
  {
    id: 'gestao-clientes',
    name: 'Gestão de Clientes',
    path: '/crm360/gestao-clientes',
    priority: 7,
  },
  { id: 'satisfacao', name: 'Satisfação de Clientes', path: '/crm360/satisfacao', priority: 8 },
  {
    id: 'consultas',
    name: 'Consultas',
    path: '/crm360/consultas',
    badge: 'Autosserviço',
    badgeType: 'auto',
    priority: 9,
  },
  {
    id: 'central-acoes',
    name: 'Central de Ações',
    path: '/crm360/central-acoes',
    badge: 'IA',
    badgeType: 'ia',
    priority: 10,
  },
  { id: 'estoque', name: 'Estoque', path: '/crm360/estoque', priority: 11 },
]

/**
 * Itens do Menu Complementar ("Mais") do CRM 360 CIAFAL
 */
export const CRM_SECONDARY_NAV_ITEMS: CrmMenuItem[] = [
  {
    id: 'sop',
    name: 'S&OP / Forecast',
    path: '/crm360/planejamento-sop',
    desc: 'Demanda F0-F4, FVA & Waterfall',
  },
  {
    id: 'equipe',
    name: 'Equipe Comercial',
    path: '/crm360/equipe',
    desc: 'Vendedores, Metas & Hierarquia',
  },
  {
    id: 'visitas',
    name: 'Visitas & Rotas',
    path: '/crm360/visitas',
    desc: 'Roteirização & Geolocalização',
  },
  { id: 'agentes', name: 'Agentes de IA', path: '/crm360/agentes', desc: 'Copilotos & Automações' },
  {
    id: 'inativos',
    name: 'Gestão de Inativos',
    path: '/crm360/gestao-inativos',
    desc: 'Reativação Comercial',
  },
  {
    id: 'agente-fred',
    name: 'Agente Fred (TMS)',
    path: '/crm360/agente-fred',
    desc: 'Rastreabilidade Logística',
  },
  {
    id: 'parametros-sap',
    name: 'Parâmetros SAP (Governança)',
    path: '/crm360/parametros-sap',
    desc: 'Regras de Exposição & Limites SAP',
  },
  {
    id: 'central-integracoes',
    name: 'Central de Integrações',
    path: '/crm360/central-integracoes',
    desc: 'SAP ECC, Qlik, TMS & SAC',
  },
  {
    id: 'administracao',
    name: 'Parâmetros & Acessos',
    path: '/crm360/administracao',
    desc: 'Configurações do CRM',
  },
]

export const CRM_MODULE_PREFIX = '/crm360'

// Re-exportações estruturadas
export * as pages from './pages'
export * as services from './services'
export * as hooks from './hooks'
export * as types from './types'
export * as providers from './providers'
export * as lib from './lib'
export * as components from './components'
