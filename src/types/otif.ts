// src/types/otif.ts
// Definições corporativas do OTIF CIAFAL (On-Time & In-Full)

export interface OtifDeliveryRecord {
  id: string
  clienteId: string
  clienteNome: string
  clienteSap: string
  pedidoNumero: string
  nfNumero: string
  transporteNumero: string
  transportadora: string
  motorista?: string
  dataDesejada: string // DD/MM/AAAA ou YYYY-MM-DD
  dataPrometida: string
  dataExpedida: string
  dataEntregue: string
  quantidadePedidaKg: number
  quantidadeEntregueKg: number
  onTime: boolean
  inFull: boolean
  otif: boolean
  motivoDesvio?: string
  responsavelDesvio?: 'Logística' | 'Comercial' | 'PCP' | 'Transportadora' | 'Cliente' | 'Qualidade'
  empresa: string
  centro: string
  vendedorNome: string
  regiao: string
  linha: string
  produtoDescricao: string
  avaliacaoEntrega?: {
    estrelas: number // 1 a 5
    comentario?: string
    respondidoEm: string
    canal: 'WhatsApp' | 'E-mail' | 'Portal'
  }
}

export interface OtifMonthlyTrend {
  mes: string // Ex: "Mai/24"
  metaPct: number // Ex: 95.0
  realizadoPct: number // Ex: 92.4
  gapPp: number // Ex: -2.6 p.p.
  onTimePct: number
  inFullPct: number
  totalEntregas: number
}

export interface OtifParameters {
  toleranciaAtrasoHoras: number // Ex: 0h (mesmo dia)
  toleranciaQuantidadePct: number // Ex: 0% para in-full estrito
  diasUteisApenas: boolean
  pesoOnTime: number // Ex: 50%
  pesoInFull: number // Ex: 50%
}
