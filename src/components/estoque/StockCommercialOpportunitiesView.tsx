import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Building2,
  PhoneCall,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  Truck,
  ArrowRight,
  Info,
} from 'lucide-react'
import type { CommercialOpportunity, StockItem } from '@/types/stock'
import { formatCurrency, formatWeight, formatNumberBR } from '@/lib/utils'

interface StockCommercialOpportunitiesViewProps {
  opportunities: CommercialOpportunity[]
  onRequestCheck: (stockItem: any) => void
  onContactCustomer: (opportunity: CommercialOpportunity) => void
}

export function StockCommercialOpportunitiesView({
  opportunities,
  onRequestCheck,
  onContactCustomer,
}: StockCommercialOpportunitiesViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* CABEÇALHO EXPLICATIVO DO MOTOR DE RECOMENDAÇÃO IA */}
      <Card className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl border-primary/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400 text-slate-950 font-bold text-xs border-none">
                IA COMERCIAL CIAFAL
              </Badge>
              <Badge
                variant="outline"
                className="text-xs text-blue-200 border-blue-400/40 font-mono"
              >
                CRUZAMENTO ESTOQUE × HISTÓRICO CARTEIRA
              </Badge>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Oportunidades de Liquidação Inteligente de Estoque
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Algoritmo de recomendação que cruza lotes envelhecidos ou parados com clientes que
              possuem frequência de compra, limite de crédito liberado e consumo histórico de
              produtos similares.
              <strong className="text-amber-300 block mt-1 font-normal">
                Nota de Governança: A IA apenas sugere abordagem e clientes prioritários — não
                altera preços nem limites automaticamente.
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Oportunidades Mapeadas
              </span>
              <span className="font-serif text-3xl font-bold text-emerald-400">
                {opportunities.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Aderência Muito Alta
              </span>
              <span className="font-serif text-3xl font-bold text-amber-400">
                {opportunities.filter((o) => o.fitScore === 'MUITO_ALTA').length}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* GRID DE CARDS DE OPORTUNIDADES COMERCIAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {opportunities.map((opp) => {
          const isVeryHigh = opp.fitScore === 'MUITO_ALTA'
          const isHigh = opp.fitScore === 'ALTA'

          const fitBadgeColor = isVeryHigh
            ? 'bg-emerald-500 text-white'
            : isHigh
              ? 'bg-blue-600 text-white'
              : 'bg-amber-500 text-slate-950 font-bold'

          return (
            <Card
              key={opp.id}
              className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all space-y-4"
            >
              {/* TOPO: PRODUTO & FIT IA */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {opp.materialCode}
                      </span>
                      <Badge className={`text-[10px] font-bold border-none ${fitBadgeColor}`}>
                        Aderência IA: {opp.fitScore.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h4 className="font-serif font-bold text-base text-slate-900 mt-1 line-clamp-1">
                      {opp.materialDescription}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Disponível
                    </span>
                    <strong className="text-sm font-bold text-slate-900">
                      {formatWeight(opp.availableTons)}
                    </strong>
                  </div>
                </div>

                {/* DADOS DO CLIENTE ALVO RECOMENDADO */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-primary" />
                      <strong className="text-xs font-bold text-slate-900">
                        {opp.customerName}
                      </strong>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white">
                      SAP: {opp.customerSap}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Segmento</span>
                      <span className="font-medium text-slate-800">{opp.customerSegment}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Crédito Livre</span>
                      <span className="font-bold text-emerald-700 font-mono text-[10px]">
                        {formatCurrency(opp.availableCredit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Consumo 12m</span>
                      <span className="font-medium text-slate-800">
                        {formatWeight(opp.consumptionHistoryTons12m)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PARECER ESTRATÉGICO IA */}
                <div className="space-y-1.5 text-xs">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Por que este cliente é aderente?
                    </span>
                    <p className="text-slate-800 text-xs leading-relaxed">{opp.aiRationale}</p>
                  </div>

                  <div className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-950">
                    <strong className="block text-[11px] text-amber-900">
                      Ação Comercial Sugerida:
                    </strong>
                    <span>{opp.recommendedAction}</span>
                  </div>
                </div>
              </div>

              {/* RODAPÉ COM AÇÕES */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  <span>Potencial sugerido: </span>
                  <strong className="text-slate-900">{formatWeight(opp.potentialTons)}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onRequestCheck({
                        materialCode: opp.materialCode,
                        description: opp.materialDescription,
                        plantCode: '1000',
                        plantName: opp.plantName,
                        storageLocation: 'DEP-01',
                        availableTons: opp.availableTons,
                        classification: opp.classification,
                      })
                    }
                    className="h-8 text-xs rounded-xl gap-1 text-slate-700"
                  >
                    <Warehouse className="w-3.5 h-3.5 text-primary" />
                    <span>Checar Lote</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => onContactCustomer(opp)}
                    className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-1 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Acionar Cliente</span>
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
