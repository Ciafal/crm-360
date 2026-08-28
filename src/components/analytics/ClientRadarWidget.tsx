import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Compass,
  Search,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Package,
  CreditCard,
  Phone,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export type ClientRadarQuadrant = 'EXPANDIR' | 'MANTER' | 'RECUPERAR' | 'REATIVAR' | 'RISCO_PERDA'

export interface ClientRadarItem {
  id: string
  name: string
  cnpj: string
  quadrant: ClientRadarQuadrant
  recenciaDias: number
  frequenciaMensal: number
  volumeTons: number
  margemPct: number
  oportunidadeTons: number
  statusCredito: 'Liberado' | 'Em Análise' | 'Bloqueado'
  nextBestAction: string
  priorityScore: number // 0 a 100
}

export interface ClientRadarWidgetProps {
  clients: ClientRadarItem[]
  onSelectClient?: (client: ClientRadarItem) => void
  className?: string
}

export const MOCK_RADAR_CLIENTS: ClientRadarItem[] = [
  {
    id: 'cli-01',
    name: 'Estruturas Metálicas Triângulo S/A',
    cnpj: '18.442.981/0001-09',
    quadrant: 'EXPANDIR',
    recenciaDias: 8,
    frequenciaMensal: 3.2,
    volumeTons: 145,
    margemPct: 18.5,
    oportunidadeTons: 60,
    statusCredito: 'Liberado',
    nextBestAction: 'Apresentar pacote de Perfis Laminados W com entrega garantida em 48h.',
    priorityScore: 92,
  },
  {
    id: 'cli-02',
    name: 'Caldeiraria & Usinagem Vale do Aço',
    cnpj: '24.119.340/0001-55',
    quadrant: 'EXPANDIR',
    recenciaDias: 12,
    frequenciaMensal: 2.8,
    volumeTons: 110,
    margemPct: 16.2,
    oportunidadeTons: 45,
    statusCredito: 'Liberado',
    nextBestAction: 'Cross-sell de Barras Chatas e Cantoneiras para novo contrato industrial.',
    priorityScore: 88,
  },
  {
    id: 'cli-03',
    name: 'Engenharia & Montagens Industriais S/A',
    cnpj: '03.882.110/0001-88',
    quadrant: 'MANTER',
    recenciaDias: 14,
    frequenciaMensal: 2.0,
    volumeTons: 85,
    margemPct: 15.0,
    oportunidadeTons: 20,
    statusCredito: 'Liberado',
    nextBestAction: 'Follow-up de rotina e alinhamento de cronograma de obras de novembro.',
    priorityScore: 74,
  },
  {
    id: 'cli-04',
    name: 'Metais Betim Indústria e Comércio',
    cnpj: '07.221.849/0001-32',
    quadrant: 'RECUPERAR',
    recenciaDias: 42,
    frequenciaMensal: 0.8,
    volumeTons: 38,
    margemPct: 13.5,
    oportunidadeTons: 70,
    statusCredito: 'Liberado',
    nextBestAction:
      'Agendar visita presencial com Gerente Técnico para revisar tabela e lote mínimo.',
    priorityScore: 96,
  },
  {
    id: 'cli-05',
    name: 'Indústria Metalúrgica Santa Rita',
    cnpj: '11.554.009/0001-77',
    quadrant: 'RISCO_PERDA',
    recenciaDias: 58,
    frequenciaMensal: 0.4,
    volumeTons: 18,
    margemPct: 12.0,
    oportunidadeTons: 50,
    statusCredito: 'Em Análise',
    nextBestAction: 'Intervenção urgente com oferta promocional de Chapas Grossas A36.',
    priorityScore: 95,
  },
  {
    id: 'cli-06',
    name: 'Serralheria & Ferragens Progresso',
    cnpj: '19.882.331/0001-44',
    quadrant: 'REATIVAR',
    recenciaDias: 110,
    frequenciaMensal: 0.0,
    volumeTons: 0,
    margemPct: 14.0,
    oportunidadeTons: 35,
    statusCredito: 'Liberado',
    nextBestAction: 'Campanha de reativação com frete grátis para primeiro pedido acima de 5 t.',
    priorityScore: 82,
  },
]

export function ClientRadarWidget({
  clients = MOCK_RADAR_CLIENTS,
  onSelectClient,
  className,
}: ClientRadarWidgetProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<ClientRadarQuadrant | 'TODOS'>('TODOS')
  const [search, setSearch] = useState('')

  const quadrantStyles: Record<
    ClientRadarQuadrant,
    { label: string; badgeClass: string; cardBorder: string }
  > = {
    EXPANDIR: {
      label: 'Expandir (Cross-sell)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cardBorder: 'border-l-emerald-600',
    },
    MANTER: {
      label: 'Manter (Fidelidade)',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      cardBorder: 'border-l-blue-600',
    },
    RECUPERAR: {
      label: 'Recuperar (Atraso Recompra)',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      cardBorder: 'border-l-amber-500',
    },
    RISCO_PERDA: {
      label: 'Risco de Perda (Crítico)',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      cardBorder: 'border-l-rose-600',
    },
    REATIVAR: {
      label: 'Reativar (Inativo Recente)',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
      cardBorder: 'border-l-purple-600',
    },
  }

  const filteredClients = clients.filter((c) => {
    const matchQuad = selectedQuadrant === 'TODOS' || c.quadrant === selectedQuadrant
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search) ||
      c.nextBestAction.toLowerCase().includes(search.toLowerCase())
    return matchQuad && matchSearch
  })

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER DO RADAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-primary">
              Radar Comercial de Clientes & Next Best Action
            </h3>
            <p className="text-xs text-muted-foreground">
              Classificação estratégica: Expandir, Manter, Recuperar, Reativar e Risco de Perda com
              score
            </p>
          </div>
        </div>

        <div className="relative w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente no radar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* SELETOR DE QUADRANTES */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelectedQuadrant('TODOS')}
          className={cn(
            'px-3 py-1 rounded-xl text-xs font-semibold transition-all',
            selectedQuadrant === 'TODOS'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          Todos ({clients.length})
        </button>

        {(
          ['EXPANDIR', 'MANTER', 'RECUPERAR', 'RISCO_PERDA', 'REATIVAR'] as ClientRadarQuadrant[]
        ).map((q) => {
          const count = clients.filter((c) => c.quadrant === q).length
          const isSelected = selectedQuadrant === q

          return (
            <button
              key={q}
              onClick={() => setSelectedQuadrant(q)}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              <span>{quadrantStyles[q].label.split(' ')[0]}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      {/* GRID DE CLIENTES DO RADAR COM PRIORIZAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredClients.map((client) => {
          const style = quadrantStyles[client.quadrant]

          return (
            <div
              key={client.id}
              onClick={() => onSelectClient?.(client)}
              className={cn(
                'p-4 rounded-2xl bg-white border border-slate-200 hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 border-l-4',
                style.cardBorder,
              )}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] font-bold', style.badgeClass)}
                  >
                    {style.label}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      Score {client.priorityScore}
                    </span>
                  </div>
                </div>

                <div>
                  <strong className="text-xs text-slate-900 block leading-snug">
                    {client.name}
                  </strong>
                  <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                    CNPJ: {client.cnpj}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      Recência
                    </span>
                    <strong className="text-slate-800 text-[11px] block">
                      {client.recenciaDias} dias
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      Volume YTD
                    </span>
                    <strong className="text-slate-800 text-[11px] block">
                      {formatWeight(client.volumeTons, 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-emerald-700 block">
                      Potencial
                    </span>
                    <strong className="text-emerald-700 text-[11px] block">
                      +{formatWeight(client.oportunidadeTons, 0)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Next Best Action */}
              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Próxima Melhor Ação:
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  {client.nextBestAction}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
