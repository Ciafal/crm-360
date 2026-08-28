import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  TrendingUp,
} from 'lucide-react'
import type { Quotation, QuotationStatus } from '@/types/quotation'
import { QuotationStatusBadge } from './QuotationStatusBadge'
import { StockBadge } from './StockBadge'
import { PriceDeviationBadge } from './PriceDeviationBadge'

export interface KanbanColumn {
  id: QuotationStatus
  title: string
  color: string
  bgColor: string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'RASCUNHO', title: 'Rascunho', color: 'border-slate-300', bgColor: 'bg-slate-50' },
  {
    id: 'EM_PREPARACAO',
    title: 'Em Preparação',
    color: 'border-blue-300',
    bgColor: 'bg-blue-50/40',
  },
  {
    id: 'AGUARDANDO_APROVACAO',
    title: 'Aguardando Aprovação',
    color: 'border-amber-300',
    bgColor: 'bg-amber-50/40',
  },
  {
    id: 'PRONTA_PARA_ENVIO',
    title: 'Pronta p/ Envio',
    color: 'border-indigo-300',
    bgColor: 'bg-indigo-50/40',
  },
  {
    id: 'ENVIADA_AO_CLIENTE',
    title: 'Enviada ao Cliente',
    color: 'border-cyan-300',
    bgColor: 'bg-cyan-50/40',
  },
  {
    id: 'AGUARDANDO_RETORNO',
    title: 'Aguardando Retorno',
    color: 'border-sky-300',
    bgColor: 'bg-sky-50/40',
  },
  { id: 'NEGOCIACAO', title: 'Negociação', color: 'border-purple-300', bgColor: 'bg-purple-50/40' },
  { id: 'ACEITA', title: 'Aceita', color: 'border-emerald-300', bgColor: 'bg-emerald-50/40' },
  {
    id: 'CONVERSAO_SAP',
    title: 'Conversão SAP',
    color: 'border-blue-400',
    bgColor: 'bg-blue-50/60',
  },
  {
    id: 'PEDIDO_IMPLANTADO',
    title: 'Pedido Implantado',
    color: 'border-emerald-500',
    bgColor: 'bg-emerald-50/80',
  },
  { id: 'PERDIDA', title: 'Perdida', color: 'border-rose-300', bgColor: 'bg-rose-50/40' },
  { id: 'CANCELADA', title: 'Cancelada', color: 'border-gray-300', bgColor: 'bg-gray-50' },
]

interface QuotationKanbanProps {
  quotations: Quotation[]
  metricMode: 'TONS' | 'REAIS'
  onSelectQuotation: (q: Quotation) => void
  onMoveQuotationStage: (quoteId: string, targetStatus: QuotationStatus) => Promise<void>
}

export function QuotationKanban({
  quotations,
  metricMode,
  onSelectQuotation,
  onMoveQuotationStage,
}: QuotationKanbanProps) {
  const [draggedQuoteId, setDraggedQuoteId] = React.useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<QuotationStatus | null>(null)

  // Cálculo de Aging
  const getAgingInfo = (enteredAtIso?: string) => {
    if (!enteredAtIso) return { hours: 0, text: '< 1h', alertLevel: 'OK' }
    const diffMs = Date.now() - new Date(enteredAtIso).getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours > 72) return { hours, text: `${hours}h`, alertLevel: 'CRITICAL' }
    if (hours > 48) return { hours, text: `${hours}h`, alertLevel: 'WARNING' }
    if (hours > 24) return { hours, text: `${hours}h`, alertLevel: 'ATTENTION' }
    return { hours, text: `${hours}h`, alertLevel: 'OK' }
  }

  const handleDragStart = (e: React.DragEvent, quoteId: string) => {
    e.dataTransfer.setData('text/plain', quoteId)
    setDraggedQuoteId(quoteId)
  }

  const handleDragOver = (e: React.DragEvent, colId: QuotationStatus) => {
    e.preventDefault()
    setDragOverColumn(colId)
  }

  const handleDrop = async (e: React.DragEvent, colId: QuotationStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const quoteId = e.dataTransfer.getData('text/plain') || draggedQuoteId
    if (quoteId) {
      await onMoveQuotationStage(quoteId, colId)
    }
    setDraggedQuoteId(null)
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-[2800px]">
        {KANBAN_COLUMNS.map((col) => {
          // Normalizar status para agrupar compatibilidade
          const colQuotes = quotations.filter((q) => {
            if (col.id === 'EM_PREPARACAO') {
              return q.status === 'EM_PREPARACAO' || q.status === 'EM_ELABORACAO'
            }
            if (col.id === 'PRONTA_PARA_ENVIO') {
              return q.status === 'PRONTA_PARA_ENVIO' || q.status === 'APROVADA_INTERNAMENTE'
            }
            if (col.id === 'NEGOCIACAO') {
              return q.status === 'NEGOCIACAO' || q.status === 'EM_NEGOCIACAO'
            }
            if (col.id === 'CONVERSAO_SAP') {
              return (
                q.status === 'CONVERSAO_SAP' ||
                q.status === 'AGUARDANDO_IMPLANTACAO_SAP' ||
                q.status === 'PROCESSANDO_SAP'
              )
            }
            if (col.id === 'PEDIDO_IMPLANTADO') {
              return q.status === 'PEDIDO_IMPLANTADO' || q.status === 'PEDIDO_SAP_IMPLANTADO'
            }
            return q.status === col.id
          })

          const totalTonsInCol = colQuotes.reduce((acc, q) => acc + (q.total_tons || 0), 0)
          const totalValInCol = colQuotes.reduce((acc, q) => acc + (q.total_value || 0), 0)

          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-[260px] shrink-0 rounded-xl border ${
                isOver
                  ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-300'
                  : `${col.color} ${col.bgColor}`
              } flex flex-col max-h-[calc(100vh-280px)] transition-all`}
            >
              {/* Header da Coluna */}
              <div className="p-3 border-b border-slate-200/60 bg-white/60 backdrop-blur-xs rounded-t-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 tracking-tight">
                    {col.title}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">
                    {colQuotes.length}
                  </Badge>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>
                    {metricMode === 'TONS'
                      ? `${totalTonsInCol.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t`
                      : `R$ ${(totalValInCol / 1000).toFixed(0)}k`}
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {colQuotes.length > 0
                      ? metricMode === 'TONS'
                        ? `R$ ${(totalValInCol / 1000).toFixed(0)}k`
                        : `${totalTonsInCol.toFixed(1)} t`
                      : ''}
                  </span>
                </div>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                {colQuotes.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-lg">
                    Nenhuma proposta
                  </div>
                ) : (
                  colQuotes.map((quote) => {
                    const aging = getAgingInfo(quote.stage_entered_at)
                    return (
                      <Card
                        key={quote.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, quote.id)}
                        onClick={() => onSelectQuotation(quote)}
                        className={`bg-white hover:shadow-md transition-all cursor-grab active:cursor-grabbing border ${
                          quote.status === 'PEDIDO_IMPLANTADO'
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : quote.status === 'PERDIDA'
                              ? 'border-rose-200'
                              : 'border-slate-200'
                        }`}
                      >
                        <CardContent className="p-3 space-y-2.5">
                          {/* Código e Tag de Aging */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-blue-800 font-mono">
                              {quote.code}{' '}
                              <span className="text-[10px] text-slate-400">v{quote.version}</span>
                            </span>

                            {/* Badge de Aging (Alerta >24h, >48h, >72h) */}
                            <Badge
                              className={`text-[9px] font-mono px-1 py-0 h-4 border ${
                                aging.alertLevel === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                                  : aging.alertLevel === 'WARNING'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5 mr-0.5" />
                              {aging.text}
                            </Badge>
                          </div>

                          {/* Cliente e Código SAP */}
                          <div>
                            <span className="font-semibold text-xs text-slate-900 line-clamp-1 block">
                              {quote.customer_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              SAP: {quote.customer_sap_code} • {quote.customer_city || 'MG'}/
                              {quote.customer_uf || 'MG'}
                            </span>
                          </div>

                          {/* Métricas: Toneladas, Valor, Probabilidade */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                Volume
                              </span>
                              <span className="font-extrabold text-slate-900">
                                {quote.total_tons?.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 1,
                                })}{' '}
                                t
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-medium">
                                Valor Total
                              </span>
                              <span className="font-bold text-slate-700 font-mono">
                                R$ {quote.total_value?.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          {/* Lista resumida de produtos */}
                          <div className="text-[11px] text-slate-600 line-clamp-1">
                            <span className="font-medium">Itens: </span>
                            {quote.items
                              ?.map((it) => `${it.material_code} (${it.quantity}t)`)
                              .join(', ')}
                          </div>

                          {/* Badges de Status: Estoque, Crédito, Desvio */}
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100">
                            <StockBadge situation={quote.stock_status} />
                            {quote.approval_status === 'PENDING' && (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] px-1 py-0 h-4">
                                Aprovação Pend.
                              </Badge>
                            )}
                            {quote.sap_order_number && (
                              <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 h-4 font-mono">
                                Pedido #{quote.sap_order_number}
                              </Badge>
                            )}
                          </div>

                          {/* Vendedor e Próxima Ação */}
                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                            <span className="truncate max-w-[120px]">{quote.seller_name}</span>
                            <span>Val: {quote.valid_until?.split('-').reverse().join('/')}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
