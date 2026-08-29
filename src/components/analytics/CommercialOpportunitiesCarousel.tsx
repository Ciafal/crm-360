import React, { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  PackageCheck,
  Truck,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CommercialOpportunityCard } from '@/types/cockpit'

interface CommercialOpportunitiesCarouselProps {
  opportunities: CommercialOpportunityCard[]
  unit: 'REVENUE' | 'TONS'
}

export function CommercialOpportunitiesCarousel({
  opportunities,
  unit,
}: CommercialOpportunitiesCarouselProps) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const isTons = unit === 'TONS'

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const formatPotencial = (reais: number, tons: number) => {
    if (isTons) {
      return `${tons.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
    }
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const getTipoBadgeColor = (tipo: CommercialOpportunityCard['tipo']) => {
    switch (tipo) {
      case 'RECOMPRA_PROVAVEL':
        return 'bg-emerald-100 text-emerald-800'
      case 'PRODUTO_ESTOQUE':
        return 'bg-sky-100 text-sky-800'
      case 'CROSS_SELL':
        return 'bg-purple-100 text-purple-800'
      case 'COMPLEMENTO_CARGA':
        return 'bg-amber-100 text-amber-800'
      case 'REATIVACAO':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
      {/* Topo do Carrossel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-xl">
            <Compass className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-primary">
                Oportunidades Comerciais (Motor de Recomendação)
              </h3>
              <Badge className="bg-purple-100 text-purple-800 text-[10px] font-bold border-none">
                {opportunities.length} Oportunidades Identificadas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Recompras prováveis, cross-sell, disponibilidade WMS Betim, complemento TMS e
              reativações
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
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="min-w-[300px] max-w-[300px] p-4 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shrink-0 snap-start"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  className={`text-[10px] font-bold border-none ${getTipoBadgeColor(opp.tipo)}`}
                >
                  {opp.urgenciaBadge}
                </Badge>
                <span className="font-mono font-bold text-xs text-primary">
                  {opp.probabilidadePct}% Propensão
                </span>
              </div>

              <div>
                <strong
                  onClick={() => navigate(`/crm/${opp.clienteId}`)}
                  className="text-xs font-bold text-slate-900 hover:text-primary cursor-pointer line-clamp-1 block"
                >
                  {opp.clienteNome}
                </strong>
                <span className="text-[10px] text-muted-foreground font-mono">
                  SAP {opp.clienteSap}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-border/40 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">{opp.titulo}</span>
                <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                  {opp.descricao}
                </p>
                <div className="pt-1 font-mono text-xs font-bold text-slate-800">
                  Potencial: {formatPotencial(opp.valorEstimadoReais, opp.volumeEstimadoTons)}
                </div>
              </div>

              {/* Explicabilidade IA */}
              <div className="p-2 bg-purple-50/60 rounded-xl text-[10px] text-purple-900 font-medium">
                <strong>Por que esta oferta?</strong> {opp.explicacaoIA}
              </div>
            </div>

            {/* Ação */}
            <div className="pt-2 border-t border-border/30">
              <Button
                size="sm"
                onClick={() => navigate(`/cotacoes/nova?clienteId=${opp.clienteId}`)}
                className="w-full h-7 text-xs bg-primary text-white rounded-lg gap-1"
              >
                Ofertar Agora <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
