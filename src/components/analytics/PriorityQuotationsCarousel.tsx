import React, { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PriorityQuotationItem {
  id: string
  code: string
  customerName: string
  customerSap: string
  totalValue: number
  totalTons: number
  probabilityPct: number
  daysWithoutContact: number
  status: string
  approvalStatus: string
  nextAction: string
  validUntil: string
}

interface PriorityQuotationsCarouselProps {
  quotations: PriorityQuotationItem[]
  unit: 'REVENUE' | 'TONS'
}

export function PriorityQuotationsCarousel({ quotations, unit }: PriorityQuotationsCarouselProps) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const isTons = unit === 'TONS'

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const formatValor = (reais: number, tons: number) => {
    if (isTons) {
      return `${tons.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
    }
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
      {/* Topo do Carrossel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 rounded-xl">
            <FileSpreadsheet className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-primary">
                Cotações Prioritárias (Fechamento Imediato)
              </h3>
              <Badge className="bg-sky-100 text-sky-800 text-[10px] font-bold border-none">
                {quotations.length} Propostas em Negociação
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Propostas de alto valor ou alta probabilidade que necessitam de follow-up
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => scroll('left')}
            className="h-8 w-8 p-0 rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => scroll('right')}
            className="h-8 w-8 p-0 rounded-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carrossel Horizontal */}
      <div
        ref={scrollRef}
        className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {quotations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground italic text-xs w-full">
            Nenhuma cotação pendente no momento.
          </div>
        ) : (
          quotations.map((q) => (
            <div
              key={q.id}
              className="min-w-[290px] max-w-[290px] p-4 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shrink-0 snap-start"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-primary bg-white px-2 py-0.5 rounded-md border border-border/40">
                    {q.code}
                  </span>
                  <Badge
                    className={`text-[10px] font-bold border-none ${
                      q.probabilityPct >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {q.probabilityPct}% Probabilidade
                  </Badge>
                </div>

                <div>
                  <strong className="text-xs font-bold text-slate-900 line-clamp-1 block">
                    {q.customerName}
                  </strong>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    SAP {q.customerSap}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-border/40 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Volume & Valor
                  </span>
                  <div className="font-serif font-bold text-sm text-slate-900">
                    {formatValor(q.totalValue, q.totalTons)}
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    {isTons
                      ? q.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : `${q.totalTons.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 font-medium space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Sem contato há {q.daysWithoutContact}d</span>
                    <span>Validade: {q.validUntil}</span>
                  </div>
                  <div className="p-1.5 bg-sky-50/70 rounded-lg text-sky-900 text-[10px]">
                    <strong>Ação:</strong> {q.nextAction}
                  </div>
                </div>
              </div>

              {/* Botões do Card */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <Button
                  size="sm"
                  onClick={() => navigate('/cotacoes')}
                  className="h-7 flex-1 text-xs bg-primary text-white rounded-lg gap-1"
                >
                  Abrir Cotação <ExternalLink className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/cotacoes`)}
                  className="h-7 text-xs rounded-lg gap-1 text-slate-700"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  Contatar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
