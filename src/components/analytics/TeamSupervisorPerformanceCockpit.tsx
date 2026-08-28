import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  Target,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Layers,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatNumberBR, formatCurrency, formatWeight } from '@/lib/utils'

// Componentes analíticos
import { ExecutiveKpiCard } from './ExecutiveKpiCard'
import { GoalThermometer } from './GoalThermometer'
import { PaceComparisonWidget } from './PaceComparisonWidget'
import {
  ExecutiveMainChart,
  ExecutiveChartPoint,
  ExecutiveMetricMode,
  PeriodViewMode,
} from './ExecutiveMainChart'
import {
  UnifiedAnalyticsFilterBar,
  UnifiedCommercialFiltersState,
  INITIAL_COMMERCIAL_FILTERS,
} from './UnifiedAnalyticsFilterBar'
import {
  TeamPerformanceMatrix,
  MOCK_TEAM_SELLERS,
  SellerPerformancePoint,
} from './TeamPerformanceMatrix'
import {
  PositiveNegativeImpactPanel,
  PositiveNegativeContributor,
} from './PositiveNegativeImpactPanel'
import { ProactiveAlertsSection, MOCK_PROACTIVE_ALERTS } from './ProactiveAlertsSection'
import { CommercialDrilldownDrawer, DrilldownContextData } from './CommercialDrilldownDrawer'

// Mock de dados agregados da equipe
const MOCK_TEAM_MONTHLY_DATA: ExecutiveChartPoint[] = [
  {
    label: 'Jan',
    realizado: 3200,
    meta: 3100,
    tendencia: 3150,
    anoAnterior: 2950,
    media3Meses: 3100,
    mediaEquipe: 3200,
    diasUteisRestantes: 0,
  },
  {
    label: 'Fev',
    realizado: 3350,
    meta: 3300,
    tendencia: 3320,
    anoAnterior: 3100,
    media3Meses: 3225,
    mediaEquipe: 3350,
    diasUteisRestantes: 0,
  },
  {
    label: 'Mar',
    realizado: 3600,
    meta: 3500,
    tendencia: 3550,
    anoAnterior: 3300,
    media3Meses: 3383,
    mediaEquipe: 3600,
    diasUteisRestantes: 0,
  },
  {
    label: 'Abr',
    realizado: 3450,
    meta: 3600,
    tendencia: 3500,
    anoAnterior: 3350,
    media3Meses: 3467,
    mediaEquipe: 3450,
    diasUteisRestantes: 0,
  },
  {
    label: 'Mai',
    realizado: 3700,
    meta: 3700,
    tendencia: 3700,
    anoAnterior: 3480,
    media3Meses: 3583,
    mediaEquipe: 3700,
    diasUteisRestantes: 0,
  },
  {
    label: 'Jun',
    realizado: 3850,
    meta: 3800,
    tendencia: 3820,
    anoAnterior: 3600,
    media3Meses: 3667,
    mediaEquipe: 3850,
    diasUteisRestantes: 0,
  },
  {
    label: 'Jul',
    realizado: 3650,
    meta: 3800,
    tendencia: 3720,
    anoAnterior: 3520,
    media3Meses: 3733,
    mediaEquipe: 3650,
    diasUteisRestantes: 0,
  },
  {
    label: 'Ago',
    realizado: 3900,
    meta: 3900,
    tendencia: 3900,
    anoAnterior: 3680,
    media3Meses: 3800,
    mediaEquipe: 3900,
    diasUteisRestantes: 0,
  },
  {
    label: 'Set',
    realizado: 3800,
    meta: 3900,
    tendencia: 3850,
    anoAnterior: 3700,
    media3Meses: 3783,
    mediaEquipe: 3800,
    diasUteisRestantes: 0,
  },
  {
    label: 'Out (Atual)',
    realizado: 2850, // Equipe total
    meta: 4000,
    tendencia: 3920,
    anoAnterior: 3720,
    media3Meses: 3850,
    mediaEquipe: 2850,
    diasUteisRestantes: 8,
    ritmoAtual: 203.5,
    ritmoNecessario: 143.7,
  },
]

export function TeamSupervisorPerformanceCockpit() {
  const [filters, setFilters] = useState<UnifiedCommercialFiltersState>(INITIAL_COMMERCIAL_FILTERS)
  const [metricMode, setMetricMode] = useState<ExecutiveMetricMode>('VOLUME')
  const [periodMode, setPeriodMode] = useState<PeriodViewMode>('YTD')

  // Estado do Drawer de Drill-down
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const [drilldownData, setDrilldownData] = useState<DrilldownContextData | null>(null)

  // Diálogo de IA por vendedor
  const [selectedSellerAI, setSelectedSellerAI] = useState<SellerPerformancePoint | null>(null)

  // Métricas Consolidadas da Equipe Comercial
  const metaTotalEquipe = 4000 // t
  const realizadoAtualEquipe = 2850 // t
  const gapRestanteEquipe = metaTotalEquipe - realizadoAtualEquipe // 1150 t
  const atingimentoPctEquipe = (realizadoAtualEquipe / metaTotalEquipe) * 100 // 71.25%
  const diasPassados = 14
  const diasRestantes = 8
  const ritmoAtualEquipe = realizadoAtualEquipe / diasPassados // 203.5 t/dia
  const ritmoNecessarioEquipe = gapRestanteEquipe / diasRestantes // 143.7 t/dia

  const handleOpenSellerDrilldown = (seller: SellerPerformancePoint) => {
    setDrilldownData({
      level: 'VENDEDOR',
      title: seller.name,
      subtitle: `${seller.role} · Performance Comercial SAP ECC`,
      entityId: seller.id,
      entityName: seller.name,
      realizadoTons: seller.volumeRealizadoTons,
      metaTons: seller.metaTons,
      faturamentoBrl: seller.volumeRealizadoTons * 6100,
      margemPct: 17.8,
      precoMedioKg: 6.1,
      itensRelacionados: [
        {
          id: 'cli-01',
          title: 'Estruturas Metálicas Triângulo',
          subtitle: 'Segmento Estruturas · MG',
          tons: 145,
          faturamento: 890000,
          status: 'Ativo',
          levelTarget: 'CLIENTE',
        },
        {
          id: 'cli-02',
          title: 'Metais Betim Indústria',
          subtitle: 'Segmento Caldeiraria · MG',
          tons: 38,
          faturamento: 235000,
          status: 'Em Risco',
          levelTarget: 'CLIENTE',
        },
      ],
    })
    setDrilldownOpen(true)
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. BARRA GLOBAL UNIFICADA DE FILTROS & SEGMENTAÇÃO (MODO GESTOR/SUPERVISOR) */}
      <UnifiedAnalyticsFilterBar
        filters={filters}
        onChange={(newFilters) => setFilters(newFilters)}
        isSellerMode={false}
      />

      {/* 2. KPIS EXECUTIVOS CONSOLIDADOS DA EQUIPE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <ExecutiveKpiCard
          title="Vendas YTD Equipe"
          value="R$ 218,4 mi"
          secondaryValue="Meta YTD: R$ 225,0 mi"
          comparisonText="+7,2% vs. mesmo período do ano anterior"
          comparisonType="positive"
          statusColor="primary"
          highlight={true}
          tooltip="Faturamento total acumulado da equipe comercial"
        />

        <ExecutiveKpiCard
          title="Volume YTD Equipe"
          value="35.790"
          unit="t"
          secondaryValue="Meta YTD: 37.500 t"
          comparisonText="+5,1% vs. mesmo período do ano anterior"
          comparisonType="positive"
          statusColor="primary"
          highlight={true}
          tooltip="Volume total em toneladas físicas faturadas por toda a equipe"
        />

        <ExecutiveKpiCard
          title="Atingimento da Meta"
          value={`${formatNumberBR(atingimentoPctEquipe, 1)}%`}
          secondaryValue={`Gap Equipe: -${formatWeight(gapRestanteEquipe, 0)}`}
          comparisonText="+3,4% vs. mesmo período do ano anterior"
          comparisonType="positive"
          statusColor="amber"
          badge={{ text: 'Mês Atual', variant: 'warning' }}
          tooltip="Atingimento global da meta mensal somando todos consultores"
        />

        <ExecutiveKpiCard
          title="Tendência Fechamento"
          value="3.920"
          unit="t"
          secondaryValue="Projeção 98,0% da meta"
          comparisonText="Ritmo da Equipe: 203,5 t/dia"
          comparisonType="positive"
          statusColor="primary"
          tooltip="Projeção estatística de fechamento consolidado"
        />

        <ExecutiveKpiCard
          title="Cobertura Pipeline Equipe"
          value="1,65x"
          secondaryValue="Pipeline 1.900 t ÷ Gap 1.150 t"
          comparisonText="Zona Confortável (>1,5x)"
          comparisonType="positive"
          statusColor="emerald"
          badge={{ text: 'Confortável', variant: 'success' }}
          tooltip="Relação entre o pipeline qualificado da equipe e o gap total"
        />

        <ExecutiveKpiCard
          title="Vendedores em Risco"
          value="1 de 4"
          unit="consultores"
          secondaryValue="Roberto Faria (62,5% da meta)"
          comparisonText="Intervenção necessária em 1 carteira"
          comparisonType="negative"
          statusColor="rose"
          tooltip="Consultores com atingimento crítico e desaceleração de tração"
        />

        <ExecutiveKpiCard
          title="Clientes Ativos Totais"
          value="142"
          unit="clientes"
          secondaryValue="Meta: 150 ativas"
          comparisonText="+8 novos clientes no ciclo"
          comparisonType="positive"
          statusColor="primary"
          tooltip="Total de empresas ativas atendidas pela equipe"
        />

        <ExecutiveKpiCard
          title="Conversão Média Equipe"
          value="64,2%"
          secondaryValue="Meta Equipe: 60,0%"
          comparisonText="+4,2% acima da referência histórica"
          comparisonType="positive"
          statusColor="emerald"
          tooltip="Taxa média de conversão de propostas comerciais"
        />

        <ExecutiveKpiCard
          title="Novos Clientes YTD"
          value="18"
          unit="novos"
          secondaryValue="Meta: 16 novos clientes"
          comparisonText="+2 acima da meta de expansão"
          comparisonType="positive"
          statusColor="primary"
          tooltip="Contas abertas com primeiro faturamento no ano corrente"
        />

        <ExecutiveKpiCard
          title="Reativações YTD"
          value="12"
          unit="reativados"
          secondaryValue="Meta: 15 reativações"
          comparisonText="+3 em negociação ativa"
          comparisonType="neutral"
          statusColor="primary"
          tooltip="Contas inativas reconquistadas no ano"
        />
      </div>

      {/* 3. SEÇÃO DO TERMÔMETRO DA META & RITMO DA EQUIPE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GoalThermometer
          percent={atingimentoPctEquipe}
          customTitle="Termômetro da Meta da Equipe"
          metaLabel="Meta Equipe: 4.000 t"
          realizadoLabel={`Realizado: ${formatWeight(realizadoAtualEquipe, 0)} | Gap Equipe: ${formatWeight(gapRestanteEquipe, 0)}`}
        />

        <PaceComparisonWidget
          ritmoAtual={ritmoAtualEquipe}
          ritmoNecessario={ritmoNecessarioEquipe}
          mediaHistorica={195.0}
          unidade="t/dia"
          diasUteisPassados={diasPassados}
          diasUteisRestantes={diasRestantes}
          metaTotal={metaTotalEquipe}
          realizadoTotal={realizadoAtualEquipe}
          gapTotal={gapRestanteEquipe}
        />
      </div>

      {/* 4. GRÁFICO PRINCIPAL COMPOSTO DA EQUIPE */}
      <ExecutiveMainChart
        title="Performance Mensal & YTD — Volume Faturado da Equipe (t)"
        subtitle="Barras = Realizado Consolidado | Linha Laranja = Meta da Equipe | Linha Pontilhada = Tendência | Rachurado = Gap"
        data={MOCK_TEAM_MONTHLY_DATA}
        metricMode={metricMode}
        onMetricModeChange={setMetricMode}
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        onBarClick={(point) => {
          handleOpenSellerDrilldown(MOCK_TEAM_SELLERS[0])
        }}
      />

      {/* 5. MATRIZ DE PERFORMANCE DA EQUIPE (4 QUADRANTES) */}
      <TeamPerformanceMatrix
        sellers={MOCK_TEAM_SELLERS}
        onSelectSeller={(seller) => handleOpenSellerDrilldown(seller)}
        onAnalyzeWithAI={(seller) => setSelectedSellerAI(seller)}
      />

      {/* 6. MODAL/PAINEL DE ANÁLISE DE IA POR VENDEDOR */}
      {selectedSellerAI && (
        <Card className="p-5 rounded-3xl bg-slate-950 text-white border border-amber-500/40 shadow-2xl space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-amber-300">
                  Diagnóstico Executivo de IA — {selectedSellerAI.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Análise comparativa vs. próprio histórico, média da equipe e melhores desempenhos
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedSellerAI(null)}
              className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200 hover:text-white"
            >
              Fechar Análise
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Pontos Fortes */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-emerald-500/30 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                Pontos Fortes & Excelência:
              </span>
              <p className="text-slate-300 leading-relaxed font-normal">
                Taxa de conversão de {formatNumberBR(selectedSellerAI.taxaConversao, 1)}% na linha
                de Perfis Laminados e excelente relacionamento com contas de caldeiraria pesada.
              </p>
            </div>

            {/* Pontos de Atenção */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-rose-500/30 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                Gargalos & Pontos de Atenção:
              </span>
              <p className="text-slate-300 leading-relaxed font-normal">
                Latência média de 32h no follow-up de cotações abertas e concentração de 65% do
                volume em apenas 3 clientes.
              </p>
            </div>

            {/* Ação do Supervisor */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
                Ação Recomendada da Supervisão:
              </span>
              <p className="text-slate-300 leading-relaxed font-normal">
                {selectedSellerAI.aiRecommendation}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 7. ALERTAS PROATIVOS DO SUPERVISOR */}
      <ProactiveAlertsSection
        alerts={MOCK_PROACTIVE_ALERTS}
        onExecuteAlert={(alert) => {
          toast.info(`Supervisor acionou: ${alert.actionLabel}`)
        }}
      />

      {/* DRAWER DE DRILL-DOWN ANALÍTICO */}
      <CommercialDrilldownDrawer
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        data={drilldownData}
        onDrillNext={(targetLevel, item) => {
          setDrilldownData({
            level: targetLevel,
            title: item.title,
            subtitle: `Detalhamento nível ${targetLevel} · ${item.subtitle}`,
            realizadoTons: item.tons || 145,
            faturamentoBrl: item.faturamento || 890000,
            margemPct: 17.5,
            precoMedioKg: 6.14,
            itensRelacionados: [],
          })
        }}
        onNavigateToEntity={(level, id) => {
          toast.success(`Navegando para o vendedor ${id} no módulo Equipe`)
        }}
      />
    </div>
  )
}
