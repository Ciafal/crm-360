import React, { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  Layers,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'

export interface CrossSellItem {
  id: string
  codigo: string
  descricao: string
  familia: string
  motivo: string
  saldoEstoqueTons?: number
  compatibilidadePct?: number
  potencialMargem?: string
  proximaProducao?: string
  aplicacao?: string
}

interface CrossSellCarouselProps {
  customerName: string
  suggestions: CrossSellItem[]
  onAddMaterial: (item: CrossSellItem) => void
}

export function CrossSellCarousel({
  customerName,
  suggestions,
  onAddMaterial,
}: CrossSellCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (suggestions.length === 0) return null

  return (
    <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 text-slate-100 border border-sky-800/40 space-y-3 shadow-md">
      {/* Topo do Bloco de Cross-Sell */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sky-800/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/20 rounded-xl border border-sky-400/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Motor de Cross-Sell & Mix Inteligente CIAFAL
              </span>
              <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[9px] font-mono">
                {suggestions.length} Sugestões
              </Badge>
            </div>
            <p className="text-[11px] text-slate-300">
              Produtos complementares e histórico de consumo para {customerName} (não adicionados
              automaticamente)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => scroll('left')}
            className="h-7 w-7 p-0 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => scroll('right')}
            className="h-7 w-7 p-0 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carrossel Horizontal de Cards de Cross-Sell */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {suggestions.map((sug) => (
          <div
            key={sug.id}
            className="min-w-[270px] max-w-[270px] p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-sky-500/60 transition-all flex flex-col justify-between space-y-2.5 shrink-0 snap-start shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-sky-400 font-bold bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800/40">
                  {sug.codigo}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {sug.saldoEstoqueTons !== undefined && sug.saldoEstoqueTons > 0
                    ? `${sug.saldoEstoqueTons.toFixed(1)} t pronta entrega`
                    : 'PCP Programado'}
                </span>
              </div>

              <div>
                <strong className="text-xs text-white block line-clamp-1">{sug.descricao}</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Linha: {sug.familia} {sug.aplicacao ? `· ${sug.aplicacao}` : ''}
                </span>
              </div>

              {/* Justificativa e Motivo */}
              <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1 text-[10px]">
                <div className="flex items-center gap-1 text-sky-300 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Por que ofertar?</span>
                </div>
                <p className="text-slate-300 leading-tight">{sug.motivo}</p>
              </div>
            </div>

            {/* Botão de Adição com Consentimento */}
            <Button
              size="sm"
              type="button"
              onClick={() => onAddMaterial(sug)}
              className="w-full h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar à Cotação
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
