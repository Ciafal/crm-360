import type { ProviderHealth } from './types'

export interface CustomerERPData {
  sapCode: string
  razaoSocial: string
  nomeFantasia?: string
  cnpj?: string
  cidade?: string
  uf?: string
  segmento?: string
  vendedor?: string
  faturamento?: number
  limiteCredito?: number
  creditoUtilizado?: number
  condicaoPagamento?: string
  statusBloqueio?: string
  ultimaCompra?: string
}

export interface MaterialERPData {
  code: string
  descricao: string
  familia?: string
  unidade?: string
}

export interface QuoteERPData {
  documentNumber: string
  customerCode: string
  valorTotal: number
  status: string
  createdAt: string
}

export interface OrderERPData {
  documentNumber: string
  customerCode: string
  valorTotal: number
  status: string
  createdAt: string
  items: Array<{ material: string; quantidade: number; preco: number }>
}

export interface ERPProvider {
  readonly name: string
  getCustomer(sapCode: string): Promise<CustomerERPData | null>
  searchCustomers(query: string): Promise<CustomerERPData[]>
  getCustomerOrders(sapCode: string): Promise<OrderERPData[]>
  getCustomerQuotes(sapCode: string): Promise<QuoteERPData[]>
  getMaterial(materialCode: string): Promise<MaterialERPData | null>
  getHealth(): Promise<ProviderHealth>
}
