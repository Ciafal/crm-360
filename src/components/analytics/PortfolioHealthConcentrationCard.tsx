import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ShieldAlert,
  PieChart,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react'
import type { PortfolioCoverageMetrics } from '@/types/cockpit'

interface PortfolioHealthConcentrationCardProps {
  coverageMetrics: PortfolioCoverageMetrics
  unit: 'REVENUE' | 'TONS'
  onOpenDrilldown: (type: 'COBERTURA' | 'SEM_MOVIMENTACAO') => void
}

export function PortfolioHealthConcentrationCard({
  coverageMetrics,
  unit,
  onOpenDrilldown,
}: PortfolioHealthConcentrationCardProps) {
  const isTons = unit === 'TONS'
  const conc = coverageMetrics.concentracaoFaturamento
  const abc = coverageMetrics.coberturaPonderadaAbc
  const saude = coverageMetrics.saudeCarteira

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm space-y-5">
      {/* Topo do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-primary">
                Saúde & Concentração da Carteira
              </h3>
              <Badge
                className={`text-[10px] font-bold border-none ${
                  saude.status === 'SAUDÁVEL'
                    ? 'bg-emerald-100 text-emerald-800'
                    : saude.status === 'ATENÇÃO'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                }`}
              >
                Carteira em {saude.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Análise ponderada de cadência ABC, dispersão de receita e detecção de falsa
              performance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDrilldown('COBERTURA')}
          className="text-xs font-bold text-primary hover:underline"
        >
          Ver Relação Completa
        </button>
      </div>

      {/* Grid: 3 Colunas (Saúde / Concentração / Cobertura Ponderada ABC) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Diagnóstico de Saúde da Carteira */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Status da Saúde Comercial
            </span>
            <p className="text-xs text-slate-700 font-medium mt-1">{saude.motivoClassificacao}</p>

            <div className="space-y-1.5 pt-3">
              {saude.fatores.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{f.nome}:</span>
                  <strong
                    className={
                      f.status === 'ok'
                        ? 'text-emerald-700'
                        : f.status === 'alerta'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                    }
                  >
                    {f.valor}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-border/40 text-[11px] text-muted-foreground">
            <strong>Evitar Falsa Sensação:</strong> Bater meta financeira com baixa cobertura expõe
            a carteira a churn silencioso.
          </div>
        </div>

        {/* 2. Concentração do Faturamento (Top 1, 3, 5, 10) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Concentração ({isTons ? 'Volume t' : 'Faturamento R$'})
            </span>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Top 1 Cliente</span>
                <strong className="text-slate-900 font-mono">
                  {isTons ? conc.top1TonsPct.toFixed(1) : conc.top1Pct.toFixed(1)}%
                </strong>
              </div>
              <Progress
                value={isTons ? conc.top1TonsPct : conc.top1Pct}
                className="h-1.5 bg-slate-200"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Top 3 Clientes</span>
                <strong className="text-slate-900 font-mono">
                  {isTons ? conc.top3TonsPct.toFixed(1) : conc.top3Pct.toFixed(1)}%
                </strong>
              </div>
              <Progress
                value={isTons ? conc.top3TonsPct : conc.top3Pct}
                className="h-1.5 bg-slate-200"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Top 5 Clientes</span>
                <strong
                  className={`font-mono ${
                    (isTons ? conc.top5TonsPct : conc.top5Pct) > 60
                      ? 'text-rose-600'
                      : 'text-slate-900'
                  }`}
                >
                  {isTons ? conc.top5TonsPct.toFixed(1) : conc.top5Pct.toFixed(1)}%
                </strong>
              </div>
              <Progress
                value={isTons ? conc.top5TonsPct : conc.top5Pct}
                className="h-1.5 bg-slate-200"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Top 10 Clientes</span>
                <strong className="text-slate-900 font-mono">
                  {isTons ? conc.top10TonsPct.toFixed(1) : conc.top10Pct.toFixed(1)}%
                </strong>
              </div>
              <Progress
                value={isTons ? conc.top10TonsPct : conc.top10Pct}
                className="h-1.5 bg-slate-200"
              />
            </div>
          </div>

          {conc.alertaConcentracaoIA && (
            <div className="p-2 bg-rose-50 text-rose-800 text-[10px] rounded-xl font-medium border border-rose-200">
              {conc.alertaConcentracaoIA}
            </div>
          )}
        </div>

        {/* 3. Cobertura Ponderada ABC */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Cobertura Ponderada ABC
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* Curva A */}
            <div className="p-2.5 bg-white rounded-xl border border-border/40 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-emerald-800">Curva A (Cadência 7d)</strong>
                <span className="font-mono font-bold text-slate-900">
                  {abc.curvaA.ativos}/{abc.curvaA.total} ({abc.curvaA.coberturaPct.toFixed(1)}%)
                </span>
              </div>
              <Progress value={abc.curvaA.coberturaPct} className="h-2 bg-slate-100" />
              <span className="text-[10px] text-muted-foreground block">
                Meta: {abc.curvaA.metaPct}% · Gap:{' '}
                {(abc.curvaA.coberturaPct - abc.curvaA.metaPct).toFixed(1)} p.p.
              </span>
            </div>

            {/* Curva B */}
            <div className="p-2.5 bg-white rounded-xl border border-border/40 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-blue-800">Curva B (Cadência 15d)</strong>
                <span className="font-mono font-bold text-slate-900">
                  {abc.curvaB.ativos}/{abc.curvaB.total} ({abc.curvaB.coberturaPct.toFixed(1)}%)
                </span>
              </div>
              <Progress value={abc.curvaB.coberturaPct} className="h-2 bg-slate-100" />
              <span className="text-[10px] text-muted-foreground block">
                Meta: {abc.curvaB.metaPct}% · Gap:{' '}
                {(abc.curvaB.coberturaPct - abc.curvaB.metaPct).toFixed(1)} p.p.
              </span>
            </div>

            {/* Curva C */}
            <div className="p-2.5 bg-white rounded-xl border border-border/40 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-slate-700">Curva C (Cadência 30d)</strong>
                <span className="font-mono font-bold text-slate-900">
                  {abc.curvaC.ativos}/{abc.curvaC.total} ({abc.curvaC.coberturaPct.toFixed(1)}%)
                </span>
              </div>
              <Progress value={abc.curvaC.coberturaPct} className="h-2 bg-slate-100" />
              <span className="text-[10px] text-muted-foreground block">
                Meta: {abc.curvaC.metaPct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
