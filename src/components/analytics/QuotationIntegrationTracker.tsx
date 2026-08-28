import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Clock,
  Flame,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Package,
  Sparkles,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export type QuoteTemperature = 'QUENTE' | 'MORNA' | 'FRIA' | 'PARADA' | 'EM_RISCO'

export interface TrackedQuotationItem {
  id: string
  code: string // Ex: COT-2024-089
  clientName: string
  productDescription: string
  tons: number
  totalBrl: number
  ageDays: number // Dias aberta
  progressPct: number // Avanço do pipeline (0 a 100%)
  probabilityPct: number
  temperature: QuoteTemperature
  lastInteractionDate: string
  stockAvailable: boolean
  stockBalanceTons?: number
  creditApproved: boolean
  nextStep: string
}

export interface QuotationIntegrationTrackerProps {
  quotes: TrackedQuotationItem[]
  onSelectQuote?: (quote: TrackedQuotationItem) => void
  onRequestStockCheck?: (quote: TrackedQuotationItem) => void
  className?: string
}

export const MOCK_TRACKED_QUOTES: TrackedQuotationItem[] = [
  {
    id: 'q-01',
    code: 'COT-2024-089',
    clientName: 'Estruturas Metálicas Triângulo',
    productDescription: 'Vigas & Perfis W 200x31.3 - Aço ASTM A572',
    tons: 85,
    totalBrl: 495000,
    ageDays: 2,
    progressPct: 80,
    probabilityPct: 85,
    temperature: 'QUENTE',
    lastInteractionDate: 'Hoje, 09:30',
    stockAvailable: true,
    stockBalanceTons: 140,
    creditApproved: true,
    nextStep: 'Aguardando validação do termo de frete CIF pelo diretor de compras.',
  },
  {
    id: 'q-02',
    code: 'COT-2024-094',
    clientName: 'Caldeiraria & Usinagem Vale do Aço',
    productDescription: 'Chapas Grossas 1/2" e 5/8" ASTM A36',
    tons: 60,
    totalBrl: 372000,
    ageDays: 4,
    progressPct: 65,
    probabilityPct: 70,
    temperature: 'MORNA',
    lastInteractionDate: 'Ontem, 16:15',
    stockAvailable: true,
    stockBalanceTons: 95,
    creditApproved: true,
    nextStep: 'Follow-up de alinhamento sobre tolerância dimensional de corte.',
  },
  {
    id: 'q-03',
    code: 'COT-2024-098',
    clientName: 'Minas Estruturas Holding S/A',
    productDescription: 'Tubos Sch40 e Cantoneiras 2" x 1/4"',
    tons: 40,
    totalBrl: 248000,
    ageDays: 7,
    progressPct: 40,
    probabilityPct: 45,
    temperature: 'PARADA',
    lastInteractionDate: 'Há 5 dias',
    stockAvailable: false,
    stockBalanceTons: 3.5, // Menor que 5t -> checagem necessária!
    creditApproved: true,
    nextStep: 'Parada sem retorno. Saldo em estoque baixo (3,5 t) — checar PCP robotizado.',
  },
  {
    id: 'q-04',
    code: 'COT-2024-102',
    clientName: 'Indústria Metalúrgica Santa Rita',
    productDescription: 'Barras Redondas Laminadas SAE 1020 e 1045',
    tons: 35,
    totalBrl: 217000,
    ageDays: 11,
    progressPct: 30,
    probabilityPct: 35,
    temperature: 'EM_RISCO',
    lastInteractionDate: 'Há 8 dias',
    stockAvailable: true,
    stockBalanceTons: 60,
    creditApproved: false, // Restrição de crédito SAP
    nextStep: 'Cliente com limite tomado no SAP F.35. Necessário aprovação de crédito suplementar.',
  },
]

export function QuotationIntegrationTracker({
  quotes = MOCK_TRACKED_QUOTES,
  onSelectQuote,
  onRequestStockCheck,
  className,
}: QuotationIntegrationTrackerProps) {
  const [filterTemp, setFilterTemp] = useState<QuoteTemperature | 'TODAS'>('TODAS')

  const tempStyles: Record<
    QuoteTemperature,
    { label: string; badgeClass: string; borderClass: string }
  > = {
    QUENTE: {
      label: 'Quente (>80%)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      borderClass: 'border-l-emerald-600',
    },
    MORNA: {
      label: 'Morna (50-80%)',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
      borderClass: 'border-l-sky-600',
    },
    FRIA: {
      label: 'Fria (<50%)',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      borderClass: 'border-l-slate-400',
    },
    PARADA: {
      label: 'Parada (>48h sem ação)',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      borderClass: 'border-l-amber-500',
    },
    EM_RISCO: {
      label: 'Em Risco (Crédito/Estoque)',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      borderClass: 'border-l-rose-600',
    },
  }

  const filteredQuotes = quotes.filter((q) => {
    if (filterTemp === 'TODAS') return true
    return q.temperature === filterTemp
  })

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER DAS COTAÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-primary">
              Integração com Cotações & Temperatura do Pipeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Monitoramento térmico: Quente, Morna, Fria, Parada e Em Risco cruzadas com Estoque e
              Crédito SAP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterTemp('TODAS')}
            className={cn(
              'px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
              filterTemp === 'TODAS'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            Todas ({quotes.length})
          </button>

          {(['QUENTE', 'MORNA', 'PARADA', 'EM_RISCO'] as QuoteTemperature[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTemp(t)}
              className={cn(
                'px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
                filterTemp === t
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              {tempStyles[t].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DAS COTAÇÕES COM CRITÉRIOS DE ESTOQUE E CRÉDITO */}
      <div className="space-y-2.5">
        {filteredQuotes.map((quote) => {
          const style = tempStyles[quote.temperature]
          const isLowStock = quote.stockBalanceTons !== undefined && quote.stockBalanceTons < 5

          return (
            <div
              key={quote.id}
              onClick={() => onSelectQuote?.(quote)}
              className={cn(
                'p-4 rounded-2xl bg-white border border-slate-200 hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-2.5 border-l-4',
                style.borderClass,
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">{quote.code}</span>
                    <strong className="text-xs text-slate-900">{quote.clientName}</strong>
                    <Badge
                      variant="outline"
                      className={cn('text-[9px] font-bold', style.badgeClass)}
                    >
                      {style.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{quote.productDescription}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-slate-900 block">
                      {formatWeight(quote.tons, 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatCurrency(quote.totalBrl)}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-mono">
                    {quote.probabilityPct}% prob
                  </span>
                </div>
              </div>

              {/* Status de Estoque, Crédito e TMS */}
              <div className="flex flex-wrap items-center gap-3 text-xs pt-2 border-t border-slate-100">
                {/* Estoque */}
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600">
                    Estoque:{' '}
                    {quote.stockAvailable ? (
                      <strong className="text-emerald-700">
                        Disponível ({quote.stockBalanceTons} t)
                      </strong>
                    ) : (
                      <strong className="text-amber-700">
                        Saldo Baixo ({quote.stockBalanceTons} t)
                      </strong>
                    )}
                  </span>
                  {isLowStock && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRequestStockCheck?.(quote)
                      }}
                      className="h-5 px-1.5 text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-bold hover:bg-amber-100"
                    >
                      Solicitar Checagem PCP
                    </Button>
                  )}
                </div>

                {/* Crédito */}
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600">
                    Crédito SAP:{' '}
                    {quote.creditApproved ? (
                      <strong className="text-emerald-700">Liberado</strong>
                    ) : (
                      <strong className="text-rose-700">Limite Tomado (F.35)</strong>
                    )}
                  </span>
                </div>

                {/* Idade / Última Interação */}
                <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">
                    {quote.lastInteractionDate} ({quote.ageDays}d aberta)
                  </span>
                </div>
              </div>

              {/* Próximo Passo */}
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between text-slate-700">
                <span className="truncate pr-2">
                  <strong>Próximo Passo:</strong> {quote.nextStep}
                </span>
                <span className="text-primary font-semibold text-[10px] flex items-center gap-0.5 shrink-0">
                  Gerenciar <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
