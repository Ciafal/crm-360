// src/components/gestao-clientes/CoverageKpisPanel.tsx
import React from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Users,
  Target,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import type { CoverageSummaryKpi } from '@/types/customer_management'
import { KpiCard, ProgressBar } from './shared/GestaoClientesUiKit'

interface CoverageKpisPanelProps {
  kpis: CoverageSummaryKpi
  onSelectFilter?: (filterType: string) => void
  activeFilter?: string
}

export function CoverageKpisPanel({ kpis, onSelectFilter, activeFilter }: CoverageKpisPanelProps) {
  // Regra semântica CIAFAL:
  // - Cobertura Geral: azul institucional (ou positivo se bateu meta)
  const isGeralMetaBatida = kpis.coberturaGeralPct >= kpis.metaCoberturaPct
  const geralVariant = isGeralMetaBatida ? 'positive' : 'default'

  // - Sem Cobertura: vermelho corporativo discreto (Diretriz 2: card padrão CIAFAL + badge discreto + ícone)
  const hasDescobertos = kpis.totalDescobertos > 0
  const descobertosVariant = hasDescobertos ? 'critical' : 'neutral'

  // - Estratégicos: azul CIAFAL (Diretriz 3: sem roxo decorativo)
  const estrategicosVariant = kpis.coberturaEstrategicosPct >= 80 ? 'positive' : 'default'

  // - Clientes A: azul CIAFAL / positivo se meta alta
  const clientesAVariant = kpis.coberturaClientesAPct >= 80 ? 'positive' : 'default'

  // - Em Risco: atenção semântica (âmbar corporativo discreto se houver risco)
  const emRiscoVariant = kpis.coberturaEmRiscoPct < 70 ? 'warning' : 'default'

  // - Prospects: azul CIAFAL (sem azul-ciano decorativo)
  const prospectsVariant = 'default'

  return (
    <div className="space-y-3">
      {/* 1. CARDS PRINCIPAIS DA COBERTURA (Padronizados com KpiCard CIAFAL) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1: Cobertura Geral */}
        <KpiCard
          title="Cobertura Geral"
          kpi={`${kpis.coberturaGeralPct}%`}
          metaText={`Meta: ${kpis.metaCoberturaPct}%`}
          description={`Gap para meta: ${kpis.gapParaMetaPct}%`}
          progressValue={kpis.coberturaGeralPct}
          variant={geralVariant}
          icon={ShieldCheck}
          badgeLabel={`${kpis.coberturaGeralPct}%`}
          footerInfo={
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
              <span>{kpis.totalCobertos} cobertos</span>
              <span>{kpis.totalElegiveis} elegíveis</span>
            </div>
          }
          active={activeFilter === 'todos'}
          onClick={() => onSelectFilter?.('todos')}
        />

        {/* Card 2: Sem Cobertura (Diretriz 2: Vermelho corporativo discreto, nunca neon/rosa) */}
        <KpiCard
          title="Sem Cobertura"
          kpi={kpis.totalDescobertos}
          metaText="clientes fora da janela"
          description="Ação comercial prioritária"
          variant={descobertosVariant}
          icon={AlertTriangle}
          badgeLabel={kpis.totalVencidos > 0 ? `${kpis.totalVencidos} vencidos` : 'Regular'}
          footerInfo={
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span
                className={kpis.totalVencidos > 0 ? 'text-red-700 font-semibold' : 'text-slate-500'}
              >
                {kpis.totalVencidos} vencidos
              </span>
              <span>Requer contato</span>
            </div>
          }
          active={activeFilter === 'descobertos'}
          onClick={() => onSelectFilter?.('descobertos')}
        />

        {/* Card 3: Estratégicos (Diretriz 3: Azul institucional, sem roxo) */}
        <KpiCard
          title="Estratégicos"
          kpi={`${kpis.coberturaEstrategicosPct}%`}
          metaText="Janela 15d"
          description="Acompanhamento quinzenal rígido"
          progressValue={kpis.coberturaEstrategicosPct}
          variant={estrategicosVariant}
          icon={Sparkles}
          badgeLabel="15 dias"
          footerInfo={
            <span className="text-[10px] text-slate-500">Frequência quinzenal prioritária</span>
          }
          active={activeFilter === 'estrategicos'}
          onClick={() => onSelectFilter?.('estrategicos')}
        />

        {/* Card 4: Clientes A (Diretriz 3: Azul institucional / Positivo se dentro da meta) */}
        <KpiCard
          title="Clientes A"
          kpi={`${kpis.coberturaClientesAPct}%`}
          metaText="Janela 30d"
          description="Ciclo mensal prioritário"
          progressValue={kpis.coberturaClientesAPct}
          variant={clientesAVariant}
          icon={Target}
          badgeLabel="30 dias"
          footerInfo={
            <span className="text-[10px] text-slate-500">Meta de relacionamento mensal</span>
          }
          active={activeFilter === 'clientes_a'}
          onClick={() => onSelectFilter?.('clientes_a')}
        />

        {/* Card 5: Em Risco (Diretriz 3: Âmbar corporativo discreto de atenção, sem laranja berrante) */}
        <KpiCard
          title="Em Risco"
          kpi={`${kpis.coberturaEmRiscoPct}%`}
          metaText="Janela 15d"
          description="Atuação intensiva de retenção"
          progressValue={kpis.coberturaEmRiscoPct}
          variant={emRiscoVariant}
          icon={ShieldAlert}
          badgeLabel="Atenção"
          footerInfo={
            <span className="text-[10px] text-amber-800 font-medium">Alerta de retenção ativa</span>
          }
          active={activeFilter === 'em_risco'}
          onClick={() => onSelectFilter?.('em_risco')}
        />

        {/* Card 6: Prospects (Diretriz 3: Azul CIAFAL institucional, sem ciano decorativo) */}
        <KpiCard
          title="Prospects"
          kpi={`${kpis.coberturaProspectsPct}%`}
          metaText="Janela 20d"
          description="Evolução do funil comercial"
          progressValue={kpis.coberturaProspectsPct}
          variant={prospectsVariant}
          icon={Users}
          badgeLabel="20 dias"
          footerInfo={<span className="text-[10px] text-slate-500">Prospecção e qualificação</span>}
          active={activeFilter === 'prospects'}
          onClick={() => onSelectFilter?.('prospects')}
        />
      </div>

      {/* 2. BARRA DE REGRAS E PARÂMETROS DA COBERTURA (Diretriz 10: Fundo claro/neutro institucional) */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Clock className="w-4 h-4 text-[#003A70] shrink-0" />
          <span>
            <strong className="text-slate-900">Frequência Parametrizada:</strong> Estratégicos:{' '}
            <strong className="text-[#003A70]">15d</strong> · Clientes A:{' '}
            <strong className="text-[#003A70]">30d</strong> · Clientes B:{' '}
            <strong className="text-[#003A70]">45d</strong> · Clientes C:{' '}
            <strong className="text-[#003A70]">60d</strong> · Risco:{' '}
            <strong className="text-amber-700">15d</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Interações válidas: WhatsApp, Telefone, E-mail, Visitas e Reuniões</span>
        </div>
      </div>
    </div>
  )
}
