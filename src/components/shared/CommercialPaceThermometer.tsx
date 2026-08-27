import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Flame, Gauge, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CommercialPaceThermometerProps {
  title?: string
  ritmoAtual: number // Valor atual (ex: 13.2 t/dia ou R$ 133.9k/dia)
  ritmoNecessario: number // Valor necessário para atingir a meta (ex: 9.8 t/dia ou R$ 78.1k/dia)
  unidade?: 't/dia' | 'R$/dia'
  diasUteisPassados?: number
  diasUteisRestantes?: number
  metaVolume?: number
  realizadoVolume?: number
  gapVolume?: number
  orientation?: 'horizontal' | 'vertical'
  isSupervisor?: boolean
  onToggleUnit?: () => void
}

/**
 * CommercialPaceThermometer:
 * Substitui o gráfico de barras tradicional por Termômetro / Gauge visual corporativo
 * Faixas configuráveis:
 * - VERDE: Ritmo Atual >= Ritmo Necessário (Acima do ritmo necessário)
 * - AMARELO: Ritmo entre 90% e 99% do necessário (Atenção / Recuperável)
 * - VERMELHO: Ritmo < 90% do necessário (Crítico / Aceleração imediata exigida)
 * Para vendedor: prioridade em toneladas/dia
 * Para supervisor: toggle toneladas/dia vs R$/dia
 */
export function CommercialPaceThermometer({
  title = 'Ritmo Comercial (Termômetro de Velocidade)',
  ritmoAtual,
  ritmoNecessario,
  unidade = 't/dia',
  diasUteisPassados = 14,
  diasUteisRestantes = 8,
  metaVolume,
  realizadoVolume,
  gapVolume,
  orientation = 'horizontal',
  isSupervisor = false,
  onToggleUnit,
}: CommercialPaceThermometerProps) {
  // Cálculo de ratio de velocidade do ritmo
  const paceRatio = ritmoNecessario > 0 ? (ritmoAtual / ritmoNecessario) * 100 : 100
  const isSuperavit = ritmoAtual >= ritmoNecessario
  const isWarning = paceRatio >= 90 && paceRatio < 100
  const isCritical = paceRatio < 90

  // Status textual obrigatório (não apenas cor)
  const statusLabel = isSuperavit
    ? 'ACIMA DO RITMO NECESSÁRIO'
    : isWarning
      ? 'ATENÇÃO — RITMO LEVEMENTE ABAIXO (90-99%)'
      : 'CRÍTICO — RITMO INSUFICIENTE (<90%)'

  const statusDescription = isSuperavit
    ? `Velocidade atual de ${ritmoAtual} ${unidade} supera os ${ritmoNecessario} ${unidade} necessários para fechar a meta nos ${diasUteisRestantes} dias úteis restantes.`
    : `Necessário acelerar a velocidade diária em +${(ritmoNecessario - ritmoAtual).toFixed(1)} ${unidade} para evitar déficit de fechamento de meta.`

  const formatUnitValue = (val: number) => {
    if (unidade === 'R$/dia') {
      return val >= 1000
        ? `R$ ${(val / 1000).toFixed(1)}k/dia`
        : `R$ ${val.toLocaleString('pt-BR')}/dia`
    }
    return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t/dia`
  }

  // Progresso visual relativo (100% de base = ritmo necessário)
  const visualPaceProgress = Math.min(
    Math.max((ritmoAtual / (ritmoNecessario * 1.5)) * 100, 5),
    100,
  )

  return (
    <Card className="p-4 rounded-2xl border border-border/60 bg-white shadow-xs space-y-4">
      {/* Header com Título e Toggle de Unidade para Supervisor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-xl',
              isSuperavit
                ? 'bg-emerald-100 text-emerald-800'
                : isWarning
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800',
            )}
          >
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-primary">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Velocidade de faturamento diário necessária vs realizada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              'text-[10px] font-bold border-none px-2.5 py-1',
              isSuperavit
                ? 'bg-emerald-600 text-white'
                : isWarning
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white',
            )}
          >
            {statusLabel}
          </Badge>

          {isSupervisor && onToggleUnit && (
            <button
              onClick={onToggleUnit}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              Alternar: {unidade}
            </button>
          )}
        </div>
      </div>

      {/* TERMÔMETRO VISUAL HORIZONTAL / GAUGE */}
      <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
              RITMO ATUAL REALIZADO
            </span>
            <span
              className={cn(
                'font-serif text-3xl font-bold block',
                isSuperavit ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-rose-700',
              )}
            >
              {formatUnitValue(ritmoAtual)}
            </span>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
              RITMO NECESSÁRIO (META)
            </span>
            <span className="font-serif text-2xl font-bold text-primary block">
              {formatUnitValue(ritmoNecessario)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Base: {diasUteisRestantes} dias úteis restantes
            </span>
          </div>
        </div>

        {/* Barra Termométrica com Marcador de Meta e Zonas de Segurança */}
        <div className="space-y-1.5 pt-2">
          <div className="relative w-full h-5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
            {/* Faixa Vermelha (<90%) */}
            <div className="absolute left-0 top-0 bottom-0 w-[60%] bg-rose-500/20" />
            {/* Faixa Amarela (90-99%) */}
            <div className="absolute left-[60%] top-0 bottom-0 w-[6.6%] bg-amber-500/30" />
            {/* Faixa Verde (>=100%) */}
            <div className="absolute left-[66.6%] top-0 bottom-0 right-0 bg-emerald-500/20" />

            {/* Linha Indicadora do Ritmo Necessário (Meta = 66.6% da escala total) */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-slate-900 z-20 shadow-xs"
              style={{ left: '66.6%' }}
              title={`Meta de Ritmo Necessário: ${formatUnitValue(ritmoNecessario)}`}
            />

            {/* Preenchimento do Termômetro Atual */}
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                isSuperavit
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                  : isWarning
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-rose-500 to-rose-600',
              )}
              style={{ width: `${visualPaceProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
            <span className="text-rose-700 font-bold">Faixa Crítica (&lt;90%)</span>
            <span className="text-amber-700 font-bold">Faixa Alerta (90-99%)</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Faixa de Segurança (≥ Meta)
            </span>
          </div>
        </div>

        {/* Mensagem de Interpretação */}
        <p className="text-xs text-slate-700 font-medium pt-1">
          <strong>Diagnóstico:</strong> {statusDescription}
        </p>
      </div>

      {/* CARDS AUXILIARES DE RITMO */}
      {(metaVolume !== undefined || realizadoVolume !== undefined || gapVolume !== undefined) && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border text-center">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">
              Realizado ({diasUteisPassados} dias)
            </span>
            <strong className="text-slate-900 text-sm">
              {realizadoVolume !== undefined ? `${realizadoVolume} t` : '-'}
            </strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border text-center">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">
              Gap a Cobrir
            </span>
            <strong className="text-amber-700 text-sm">
              {gapVolume !== undefined ? `${gapVolume} t` : '-'}
            </strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border text-center">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">
              Meta Total
            </span>
            <strong className="text-primary text-sm">
              {metaVolume !== undefined ? `${metaVolume} t` : '-'}
            </strong>
          </div>
        </div>
      )}
    </Card>
  )
}
