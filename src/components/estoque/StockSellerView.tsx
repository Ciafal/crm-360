import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Warehouse,
  Truck,
  Factory,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react'
import type { StockItem } from '@/types/stock'
import { formatCurrency, formatWeight, formatNumberBR } from '@/lib/utils'
import { dataExposurePolicyService } from '@/services/data_exposure_policy_service'
import { useAuth } from '@/hooks/use-auth'

interface StockSellerViewProps {
  items: StockItem[]
  onRequestCheck: (item: StockItem) => void
  onFindOpportunities: (item: StockItem) => void
  userName?: string
}

export function StockSellerView({
  items,
  onRequestCheck,
  onFindOpportunities,
  userName = 'Carlos Mendonça',
}: StockSellerViewProps) {
  const { user } = useAuth()
  const totalAvailableTons = items.reduce((acc, it) => acc + it.availableTons, 0)
  const totalItemsCount = items.length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. COCKPIT DO VENDEDOR (Governança e Objetividade Comercial) */}
      <Card className="p-6 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary font-bold text-xs border-none">
                ESTOQUE AUTORIZADO P/ VENDA
              </Badge>
              <Badge variant="outline" className="text-xs bg-slate-50 font-mono">
                Vendedor: {userName}
              </Badge>
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900">
              Minha Disponibilidade Comercial Imediata
            </h3>
            <p className="text-xs text-muted-foreground">
              Visão governada com base nas famílias de produtos autorizadas, centros regionais e
              saldo real livre para faturamento imediato.
            </p>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Disponível Carteira
              </span>
              <strong className="font-serif text-3xl font-bold text-emerald-700 block">
                {formatWeight(totalAvailableTons)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                SKUs Habilitados
              </span>
              <strong className="font-serif text-3xl font-bold text-primary block">
                {totalItemsCount}
              </strong>
            </div>
          </div>
        </div>

        {/* REGRAS VISUAIS DE SEGURANÇA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700 text-[11px]">
              <strong>Isolamento Garantido:</strong> Você visualiza apenas os itens e centros da sua
              alçada.
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-blue-50/60 rounded-2xl">
            <Truck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-slate-700 text-[11px]">
              <strong>TMS Integrado:</strong> Veja janelas de carregamento e complemento de carga.
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-purple-50/60 rounded-2xl">
            <Factory className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="text-slate-700 text-[11px]">
              <strong>PCP Robotizado:</strong> Previsão de produção futura para negociar entregas
              programadas.
            </span>
          </div>
        </div>
      </Card>

      {/* 2. CATÁLOGO COMERCIAL DE ESTOQUE DISPONÍVEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const exposure = dataExposurePolicyService.evaluateStockExposure(
            item.availableTons,
            user,
            {
              consumerModule: 'Estoque / Visão Vendedor',
            },
          )
          const isLowStock = exposure.isLowStock
          const hasTms = item.tmsComplementAvailable
          const hasPcp = item.projectedPcpTons > 0

          return (
            <Card
              key={item.id}
              className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all space-y-3.5"
            >
              {/* TOPO: CÓDIGO, FAMÍLIA E CENTRO */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {item.materialCode}
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-slate-50 ml-1.5">
                      {item.family}
                    </Badge>
                  </div>

                  <Badge
                    className={`text-[9px] font-bold border-none ${
                      item.classification === 'NORMAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.classification === 'PARADO' || item.classification === 'CRITICO'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.classification.replace('_', ' ')}
                  </Badge>
                </div>

                <h4 className="font-serif font-bold text-sm text-slate-900 mt-2 line-clamp-2">
                  {item.description}
                </h4>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Qualidade: <strong>{item.quality}</strong> · Bitola: {item.bitola}
                </span>
              </div>

              {/* SALDOS CLARAMENTE SEGREGADOS (Regra 15) */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Disponível p/ Venda Imediata
                  </span>
                  <div className="flex items-center gap-1.5">
                    {exposure.isCapped && (
                      <span
                        className="text-[9px] font-bold px-1 py-0.2 rounded bg-sky-100 text-sky-800"
                        title={exposure.tooltip}
                      >
                        Capped
                      </span>
                    )}
                    {exposure.isLowStock && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Baixo estoque
                      </span>
                    )}
                    <strong
                      className="text-base font-bold text-emerald-700"
                      title={exposure.tooltip}
                    >
                      {exposure.displayValue}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[10px] text-muted-foreground">
                  <div>
                    <span>Físico Pátio: </span>
                    <strong className="text-slate-800">{formatWeight(item.physicalTons)}</strong>
                  </div>
                  <div>
                    <span>Reservado: </span>
                    <strong className="text-amber-800">{formatWeight(item.committedTons)}</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 pt-0.5 flex items-center justify-between">
                  <span>
                    Local:{' '}
                    <strong>
                      {item.plantName} ({item.storageLocation})
                    </strong>
                  </span>
                  <span className="font-mono">{item.batchNumber || 'Lote Único'}</span>
                </div>
              </div>

              {/* INTEGRAÇÕES TMS & PCP */}
              <div className="space-y-1.5 text-xs">
                {hasTms && (
                  <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="text-[10px] text-blue-950 leading-tight">
                      <strong>Complemento Logístico TMS:</strong> Janela de saída prevista para{' '}
                      <span className="underline">
                        {item.tmsNextLoadingWindow || 'esta semana'}
                      </span>{' '}
                      ({item.tmsRegionDest}).
                    </div>
                  </div>
                )}

                {hasPcp && (
                  <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200/60 flex items-start gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-purple-950 leading-tight">
                      <strong>PCP Programado:</strong> +{formatWeight(item.projectedPcpTons)} em
                      laminação para {item.pcpNextProductionDate} (Linha {item.pcpLine}).{' '}
                      <em>Saldo projetado não é faturável hoje.</em>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTÕES DE AÇÃO DO VENDEDOR */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onRequestCheck(item)}
                  className="h-8 flex-1 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-1 shadow-xs"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Checar Saldo</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onFindOpportunities(item)}
                  className="h-8 text-xs rounded-xl gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                  title="Ver clientes compradores recomendados pela IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Clientes IA</span>
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
