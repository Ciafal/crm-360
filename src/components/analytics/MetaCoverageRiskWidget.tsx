import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Clock,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Truck,
  Package,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight, formatCurrency } from '@/lib/utils'

export interface MetaCoverageRiskWidgetProps {
  gapRestanteTons: number // Ex: 280 t
  gapRestanteBrl?: number
  pipelineTotalTons: number // Ex: 680 t
  pipelineQualificadoTons: number // Ex: 420 t
  pipelinePonderadoTons: number // Ex: 336 t
  taxaConversao?: number // Ex: 68%
  diasUteisRestantes?: number // Ex: 8
  onDrilldownPipeline?: () => void
  className?: string
}

import {
  calculateWeightedRiskScore,
  getRiskWeights,
  saveRiskWeights,
  RiskScoreWeights,
} from '@/services/real_commercial_analytics'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Settings, Sliders } from 'lucide-react'
import { toast } from 'sonner'

export function MetaCoverageRiskWidget({
  gapRestanteTons,
  gapRestanteBrl,
  pipelineTotalTons,
  pipelineQualificadoTons,
  pipelinePonderadoTons,
  taxaConversao = 65,
  diasUteisRestantes = 8,
  onDrilldownPipeline,
  className,
}: MetaCoverageRiskWidgetProps) {
  const [weightsModalOpen, setWeightsModalOpen] = useState(false)
  const [currentWeights, setCurrentWeights] = useState<RiskScoreWeights>(getRiskWeights())

  // Cálculo de Cobertura da Meta: Pipeline Qualificado / Gap Restante
  const coverageRatio = gapRestanteTons > 0 ? pipelineQualificadoTons / gapRestanteTons : 2.5
  const coveragePercent = coverageRatio * 100

  const isComfortable = coverageRatio >= 1.5
  const isAttention = coverageRatio >= 1.0 && coverageRatio < 1.5
  const isInsufficient = coverageRatio < 1.0

  // Score de Risco Ponderado Real CIAFAL
  const calculatedRisk = calculateWeightedRiskScore(
    gapRestanteTons,
    pipelinePonderadoTons || pipelineQualificadoTons,
    45.5,
    26.6,
    1,
    currentWeights,
  )
  const riskScore = calculatedRisk.score
  const riskCategory = calculatedRisk.category

  const handleSaveWeights = () => {
    saveRiskWeights(currentWeights)
    toast.success('Pesos do Score de Risco da Meta parametrizados com sucesso!')
    setWeightsModalOpen(false)
  }

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER: COBERTURA & RISCO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'p-2 rounded-xl',
              isComfortable
                ? 'bg-emerald-100 text-emerald-800'
                : isAttention
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800',
            )}
          >
            {isComfortable ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-primary">
                Cobertura da Meta & Score de Risco
              </h3>
              <Badge
                className={cn(
                  'text-[10px] font-bold border-none px-2 py-0.5',
                  riskCategory === 'Baixo'
                    ? 'bg-emerald-100 text-emerald-800'
                    : riskCategory === 'Moderado'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800',
                )}
              >
                Risco {riskCategory} ({riskScore} pts)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline Qualificado ÷ Gap Restante ({formatNumberBR(coverageRatio, 2)}x de cobertura)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeightsModalOpen(true)}
            className="h-8 px-2.5 text-xs text-slate-700 hover:text-primary gap-1 rounded-xl"
            title="Parametrizar Pesos do Score de Risco"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parametrizar Pesos</span>
          </Button>

          <Badge
            className={cn(
              'text-xs font-bold px-3 py-1 border-none',
              isComfortable
                ? 'bg-emerald-600 text-white'
                : isAttention
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white',
            )}
          >
            {isComfortable
              ? 'PIPELINE CONFORTÁVEL (>1.5x)'
              : isAttention
                ? 'PIPELINE EM ATENÇÃO (1.0x-1.5x)'
                : 'PIPELINE INSUFICIENTE (<1.0x)'}
          </Badge>
        </div>
      </div>

      {/* COMPARATIVO VISUAL: GAP RESTANTE vs PIPELINE TOTAL vs QUALIFICADO vs PONDERADO */}
      <div className="space-y-3 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 bg-white rounded-xl border">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Gap Restante
            </span>
            <strong className="font-serif text-lg text-amber-700 block mt-0.5">
              {formatWeight(gapRestanteTons, 0)}
            </strong>
            <span className="text-[10px] text-muted-foreground">Falta fechar no mês</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border">
            <span className="text-[10px] uppercase font-bold text-slate-700 block">
              Pipeline Total
            </span>
            <strong className="font-serif text-lg text-slate-900 block mt-0.5">
              {formatWeight(pipelineTotalTons, 0)}
            </strong>
            <span className="text-[10px] text-muted-foreground">Todas oportunidades</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-primary/30">
            <span className="text-[10px] uppercase font-bold text-primary block">
              Pipeline Qualificado
            </span>
            <strong className="font-serif text-lg text-primary block mt-0.5">
              {formatWeight(pipelineQualificadoTons, 0)}
            </strong>
            <span className="text-[10px] text-primary font-semibold">
              {formatNumberBR(coverageRatio, 2)}x o gap
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Pipeline Ponderado
            </span>
            <strong className="font-serif text-lg text-emerald-700 block mt-0.5">
              {formatWeight(pipelinePonderadoTons, 0)}
            </strong>
            <span className="text-[10px] text-muted-foreground">
              {formatNumberBR((pipelinePonderadoTons / (gapRestanteTons || 1)) * 100, 0)}% do gap
            </span>
          </div>
        </div>

        {/* Barra de Proporção de Cobertura */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
            <span>Relação Pipeline Qualificado ÷ Gap</span>
            <span>
              {formatNumberBR(coveragePercent, 0)}% ({formatNumberBR(coverageRatio, 2)}x)
            </span>
          </div>

          <div className="relative w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
            {/* Marcador 1.0x (100%) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-20"
              style={{ left: '50%' }}
              title="Linha de 1.0x (Igual ao Gap)"
            />
            {/* Marcador 1.5x (150%) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-800 z-20"
              style={{ left: '75%' }}
              title="Linha de 1.5x (Zona Confortável)"
            />

            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                isComfortable ? 'bg-emerald-600' : isAttention ? 'bg-amber-500' : 'bg-rose-500',
              )}
              style={{ width: `${Math.min(coverageRatio * 50, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span className="text-rose-700 font-bold">&lt;1.0x Insuficiente</span>
            <span className="text-amber-700 font-bold">1.0x - 1.5x Atenção</span>
            <span className="text-emerald-700 font-bold">&gt;1.5x Confortável</span>
          </div>
        </div>
      </div>

      {/* DIALOG DE PARAMETRIZAÇÃO DOS PESOS DO SCORE DE RISCO */}
      <Dialog open={weightsModalOpen} onOpenChange={setWeightsModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" /> Parametrização do Score de Risco da Meta
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajuste os pesos dos critérios corporativos CIAFAL para cálculo do risco da meta
              comercial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Cobertura do Pipeline (%):</Label>
                <Input
                  type="number"
                  value={currentWeights.coberturaRatioWeight}
                  onChange={(e) =>
                    setCurrentWeights({
                      ...currentWeights,
                      coberturaRatioWeight: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ritmo Atual de Vendas (%):</Label>
                <Input
                  type="number"
                  value={currentWeights.ritmoVendasWeight}
                  onChange={(e) =>
                    setCurrentWeights({
                      ...currentWeights,
                      ritmoVendasWeight: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Concentração de Clientes (%):</Label>
                <Input
                  type="number"
                  value={currentWeights.concentracaoClientesWeight}
                  onChange={(e) =>
                    setCurrentWeights({
                      ...currentWeights,
                      concentracaoClientesWeight: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Risco de Crédito SAP ECC (%):</Label>
                <Input
                  type="number"
                  value={currentWeights.riscoCreditoWeight}
                  onChange={(e) =>
                    setCurrentWeights({
                      ...currentWeights,
                      riscoCreditoWeight: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Risco Logístico TMS (%):</Label>
                <Input
                  type="number"
                  value={currentWeights.riscoLogisticoTMSWeight}
                  onChange={(e) =>
                    setCurrentWeights({
                      ...currentWeights,
                      riscoLogisticoTMSWeight: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Oportunidades Paradas (%):</Label>
                <Input
                  type="number"
                  value={currentWeights.oportunidadesParadasWeight}
                  onChange={(e) =>
                    setCurrentWeights({
                      ...currentWeights,
                      oportunidadesParadasWeight: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900">
              Soma total dos pesos:{' '}
              <strong>
                {currentWeights.coberturaRatioWeight +
                  currentWeights.ritmoVendasWeight +
                  currentWeights.concentracaoClientesWeight +
                  currentWeights.riscoCreditoWeight +
                  currentWeights.riscoLogisticoTMSWeight +
                  currentWeights.oportunidadesParadasWeight}
                %
              </strong>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeightsModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveWeights}
              className="h-8 text-xs bg-primary text-white"
            >
              Salvar Parâmetros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MATRIZ DE FATORES EXPLICATIVOS DO RISCO (ESTOQUE, CRÉDITO, TMS, CONVERSÃO) */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider block">
          Fatores Multissistema que Compõem o Score de Risco:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Estoque / WMS */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-primary" /> Estoque & Saldos
              </span>
              <Badge className="bg-emerald-50 text-emerald-800 text-[9px] border-emerald-200">
                Disponível
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              92% dos itens do pipeline possuem saldo físico no CD Contagem ou produção prevista.
            </p>
          </div>

          {/* Crédito SAP ECC */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-sky-600" /> Crédito & Limites
              </span>
              <Badge className="bg-amber-50 text-amber-800 text-[9px] border-amber-200">
                Atenção 2 Contas
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              2 cotações de grande porte exigem liberação de crédito suplementar na esteira SAP
              F.35.
            </p>
          </div>

          {/* TMS Logística */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-violet-600" /> Janela Logística
              </span>
              <Badge className="bg-emerald-50 text-emerald-800 text-[9px] border-emerald-200">
                Prazo Conforme
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lead time estimado de 24h a 48h para região metropolitana de Belo Horizonte e Betim.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
