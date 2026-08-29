import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Target,
  Users,
  Compass,
  FileText,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatNumberBR, formatCurrency, formatWeight } from '@/lib/utils'

// Componentes da nova biblioteca analítica executiva
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
import { ExecutiveAIInsightsBlock, StructuredAIAction } from './ExecutiveAIInsightsBlock'
import { MetaPredictionModule } from './MetaPredictionModule'
import { MetaCoverageRiskWidget } from './MetaCoverageRiskWidget'
import { GapDecompositionPanel, DEFAULT_GAP_BREAKDOWN } from './GapDecompositionPanel'
import {
  PositiveNegativeImpactPanel,
  PositiveNegativeContributor,
} from './PositiveNegativeImpactPanel'
import { ClientRadarWidget, MOCK_RADAR_CLIENTS, ClientRadarItem } from './ClientRadarWidget'
import { MetaActionPlanModule, MOCK_RECOVERY_ITEMS } from './MetaActionPlanModule'
import {
  QuotationIntegrationTracker,
  MOCK_TRACKED_QUOTES,
  TrackedQuotationItem,
} from './QuotationIntegrationTracker'
import { ProactiveAlertsSection, MOCK_PROACTIVE_ALERTS } from './ProactiveAlertsSection'
import { SellerDailyCockpitHeader } from './SellerDailyCockpitHeader'
import { cockpitCommercialService } from '@/services/cockpit_commercial_service'
import {
  CommercialDrilldownDrawer,
  DrilldownContextData,
  DrilldownLevel,
} from './CommercialDrilldownDrawer'
import { getRealDrilldownData } from '@/services/real_commercial_analytics'
import { useNavigate } from 'react-router-dom'

// Mock Data para a Série Temporal (YTD e Mensal)
const MOCK_MONTHLY_CHART_DATA: ExecutiveChartPoint[] = [
  {
    label: 'Jan',
    realizado: 820,
    meta: 800,
    tendencia: 810,
    anoAnterior: 780,
    media3Meses: 800,
    mediaEquipe: 790,
    diasUteisRestantes: 0,
  },
  {
    label: 'Fev',
    realizado: 860,
    meta: 850,
    tendencia: 855,
    anoAnterior: 810,
    media3Meses: 830,
    mediaEquipe: 825,
    diasUteisRestantes: 0,
  },
  {
    label: 'Mar',
    realizado: 910,
    meta: 900,
    tendencia: 905,
    anoAnterior: 850,
    media3Meses: 863,
    mediaEquipe: 870,
    diasUteisRestantes: 0,
  },
  {
    label: 'Abr',
    realizado: 890,
    meta: 920,
    tendencia: 900,
    anoAnterior: 860,
    media3Meses: 887,
    mediaEquipe: 880,
    diasUteisRestantes: 0,
  },
  {
    label: 'Mai',
    realizado: 940,
    meta: 950,
    tendencia: 945,
    anoAnterior: 890,
    media3Meses: 913,
    mediaEquipe: 915,
    diasUteisRestantes: 0,
  },
  {
    label: 'Jun',
    realizado: 980,
    meta: 980,
    tendencia: 980,
    anoAnterior: 920,
    media3Meses: 937,
    mediaEquipe: 940,
    diasUteisRestantes: 0,
  },
  {
    label: 'Jul',
    realizado: 930,
    meta: 980,
    tendencia: 950,
    anoAnterior: 910,
    media3Meses: 950,
    mediaEquipe: 935,
    diasUteisRestantes: 0,
  },
  {
    label: 'Ago',
    realizado: 990,
    meta: 1000,
    tendencia: 995,
    anoAnterior: 940,
    media3Meses: 967,
    mediaEquipe: 960,
    diasUteisRestantes: 0,
  },
  {
    label: 'Set',
    realizado: 970,
    meta: 1000,
    tendencia: 980,
    anoAnterior: 950,
    media3Meses: 963,
    mediaEquipe: 955,
    diasUteisRestantes: 0,
  },
  {
    label: 'Out (Atual)',
    realizado: 720,
    meta: 1000,
    tendencia: 985,
    anoAnterior: 930,
    media3Meses: 963,
    mediaEquipe: 940,
    diasUteisRestantes: 8,
    ritmoAtual: 51.4,
    ritmoNecessario: 35.0,
  },
]

const MOCK_POSITIVE_CONTRIBUTORS: PositiveNegativeContributor[] = [
  {
    id: 'pos-01',
    name: 'Estruturas Metálicas Triângulo S/A',
    entityType: 'CLIENTE',
    volumeRealizadoTons: 145,
    volumeAnteriorTons: 95,
    variacaoTons: 50,
    variacaoPct: 52.6,
    contribuicaoPct: 20.1,
    nextAction: 'Confirmar entrega programada de Perfis W de 200mm.',
  },
  {
    id: 'pos-02',
    name: 'Perfis Laminados W (Linha)',
    entityType: 'PRODUTO',
    volumeRealizadoTons: 280,
    volumeAnteriorTons: 210,
    variacaoTons: 70,
    variacaoPct: 33.3,
    contribuicaoPct: 28.5,
    nextAction: 'Manter estoque regulador no CD Betim com garantia de 48h.',
  },
  {
    id: 'pos-03',
    name: 'Construtora Minas Gerais S/A',
    entityType: 'CLIENTE',
    volumeRealizadoTons: 85,
    volumeAnteriorTons: 50,
    variacaoTons: 35,
    variacaoPct: 70.0,
    contribuicaoPct: 14.2,
    nextAction: 'Apresentar proposta para fornecimento contínuo de telas soldadas.',
  },
]

const MOCK_NEGATIVE_CONTRIBUTORS: PositiveNegativeContributor[] = [
  {
    id: 'neg-01',
    name: 'Metais Betim Indústria Ltda',
    entityType: 'CLIENTE',
    volumeRealizadoTons: 38,
    volumeAnteriorTons: 90,
    variacaoTons: -52,
    variacaoPct: -57.7,
    contribuicaoPct: -22.4,
    nextAction: 'Ligar para comprador e oferecer condição CIF com desconto por lote.',
  },
  {
    id: 'neg-02',
    name: 'Tubos Industriais Sch40 (Linha)',
    entityType: 'PRODUTO',
    volumeRealizadoTons: 65,
    volumeAnteriorTons: 140,
    variacaoTons: -75,
    variacaoPct: -53.5,
    contribuicaoPct: -32.1,
    nextAction: 'Ajustar tabela de alçada especial e revisar cotações em aberto.',
  },
  {
    id: 'neg-03',
    name: 'Indústria Metalúrgica Santa Rita',
    entityType: 'CLIENTE',
    volumeRealizadoTons: 18,
    volumeAnteriorTons: 45,
    variacaoTons: -27,
    variacaoPct: -60.0,
    contribuicaoPct: -11.5,
    nextAction: 'Revalidar limite de crédito no SAP F.35 e agendar visita presencial.',
  },
]

export function SellerPerformanceCockpit() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<UnifiedCommercialFiltersState>(INITIAL_COMMERCIAL_FILTERS)
  const [metricMode, setMetricMode] = useState<ExecutiveMetricMode>('VOLUME')
  const [periodMode, setPeriodMode] = useState<PeriodViewMode>('YTD')

  // Estado do Drawer de Drill-down
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const [drilldownData, setDrilldownData] = useState<DrilldownContextData | null>(null)

  // Métricas do Vendedor (Outubro / YTD)
  const metaTotal = 1000
  const realizadoAtual = 720
  const gapRestante = metaTotal - realizadoAtual
  const atingimentoPct = (realizadoAtual / metaTotal) * 100
  const diasPassados = 14
  const diasRestantes = 8
  const ritmoAtual = realizadoAtual / diasPassados
  const ritmoNecessario = gapRestante / diasRestantes

  const pipelineTotal = 680
  const pipelineQualificado = 420
  const pipelinePonderado = 336

  // Ações da IA estruturadas
  const aiActions: StructuredAIAction[] = [
    {
      id: 'act-01',
      title: 'Acelerar Cotação COT-2024-089 (Perfis W)',
      description:
        'Contatar Engº Rodrigo (Estruturas Triângulo) — potencial de 85 t com entrega em 48h.',
      impactTons: 85,
      impactBrl: 495000,
      priority: 'Alta',
      justification:
        'Cotação com probabilidade de 85% e estoque com 140 t livres no CD Contagem. O cliente aceitou o prazo e aguarda apenas envio do termo CIF bonificado.',
      sourceSystem: 'SAP ECC',
      stockStatus: 'DISPONIVEL',
      creditStatus: 'LIBERADO',
    },
    {
      id: 'act-02',
      title: 'Antecipar Pedido Quinzenal da Metais Betim',
      description:
        'Acionar Marcos Aurélio (Metais Betim) — potencial estimado de 60 t de Chapas Grossas A36.',
      impactTons: 60,
      impactBrl: 372000,
      priority: 'Alta',
      justification:
        'Cliente sem compras há 42 dias (costuma comprar a cada 28 dias). Há 95 t de Chapas A36 disponíveis em estoque e crédito liberado de R$ 1.200.000,00.',
      sourceSystem: 'CRM',
      stockStatus: 'DISPONIVEL',
      creditStatus: 'LIBERADO',
    },
    {
      id: 'act-03',
      title: 'Cross-sell de Barras Chatas e Cantoneiras',
      description: 'Oferecer 45 t de Cantoneiras para a Caldeiraria & Usinagem Vale do Aço.',
      impactTons: 45,
      impactBrl: 260000,
      priority: 'Média',
      justification:
        'Histórico de compras do cliente aponta aquisição combinada de Perfis e Cantoneiras em 80% dos grandes projetos.',
      sourceSystem: 'Qlik',
      stockStatus: 'DISPONIVEL',
      creditStatus: 'LIBERADO',
    },
    {
      id: 'act-04',
      title: 'Checar Programação PCP de Tubos Sch40',
      description: 'Validar disponibilidade de 40 t no PCP Betim para a Minas Estruturas Holding.',
      impactTons: 40,
      impactBrl: 248000,
      priority: 'Média',
      justification:
        'Saldo físico em 3,5 t. Programação do laminador robotizado indica lote previsto para 28/10.',
      sourceSystem: 'PCP',
      stockStatus: 'BAIXO_SALDO',
      creditStatus: 'LIBERADO',
    },
    {
      id: 'act-05',
      title: 'Reativar Serralheria Progresso Ltda',
      description: 'Apresentar campanha de reativação com primeiro frete grátis (potencial 35 t).',
      impactTons: 35,
      impactBrl: 195000,
      priority: 'Baixa',
      justification:
        'Conta inativa há 110 dias com crédito de R$ 300.000,00 recém-aprovado no SAP F.35.',
      sourceSystem: 'SAP ECC',
      stockStatus: 'EM_PRODUCAO',
      creditStatus: 'LIBERADO',
    },
  ]

  const handleOpenDrilldown = (entity: any, forcedLevel?: DrilldownLevel) => {
    const drillLevel: DrilldownLevel =
      forcedLevel ||
      (entity.cargo
        ? 'VENDEDOR'
        : entity.sapCode || entity.cnpj
          ? 'CLIENTE'
          : entity.codigo
            ? 'PRODUTO'
            : 'CLIENTE')

    const realData = getRealDrilldownData({
      level: drillLevel,
      id: entity.id || entity.codigo || entity.code || entity.sapCode,
      sellerName: entity.name || entity.nome,
      customerName: entity.razaoSocial || entity.customer_name || entity.name,
    })

    setDrilldownData(realData)
    setDrilldownOpen(true)
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. SEÇÃO FIXA MATINAL: O QUE FAZER HOJE */}
      <SellerDailyCockpitHeader
        coverageMetrics={cockpitCommercialService.getPortfolioCoverage(
          cockpitCommercialService.getPortfolioCustomers(),
        )}
        goalMetrics={cockpitCommercialService.getGoalPaceMetrics()}
        oitfPct={94.2}
        unit={metricMode === 'VOLUME' ? 'TONS' : 'REVENUE'}
        onDrilldownClick={(type) =>
          handleOpenDrilldown({ id: 'kpi-01', name: `Detalhamento ${type}` })
        }
      />

      {/* 2. BARRA GLOBAL UNIFICADA DE FILTROS & SEGMENTAÇÃO */}
      <UnifiedAnalyticsFilterBar
        filters={filters}
        onChange={(newFilters) => setFilters(newFilters)}
        isSellerMode={true}
      />

      {/* 3. KPIS PRINCIPAIS NO TOPO (PADRÃO EXECUTIVO CIAFAL) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Vendas YTD */}
        <ExecutiveKpiCard
          title="Vendas YTD"
          value="R$ 54,8 mi"
          secondaryValue="Meta YTD: R$ 56,0 mi"
          comparisonText="+6,4% vs. mesmo período do ano anterior"
          comparisonType="positive"
          statusColor="primary"
          highlight={true}
          tooltip="Faturamento total acumulado no ano vigente vs. ano anterior"
        />

        {/* Volume YTD */}
        <ExecutiveKpiCard
          title="Volume YTD"
          value="8.980"
          unit="t"
          secondaryValue="Meta YTD: 9.380 t"
          comparisonText="+4,8% vs. mesmo período do ano anterior"
          comparisonType="positive"
          statusColor="primary"
          highlight={true}
          tooltip="Volume total em toneladas físicas faturadas no SAP ECC"
        />

        {/* Atingimento da Meta */}
        <ExecutiveKpiCard
          title="Atingimento da Meta"
          value={`${formatNumberBR(atingimentoPct, 1)}%`}
          secondaryValue={`Gap: -${formatWeight(gapRestante, 0)}`}
          comparisonText="+2,1% vs. mesmo período do ano anterior"
          comparisonType="positive"
          statusColor="amber"
          badge={{ text: 'Mês Atual', variant: 'warning' }}
          tooltip="Percentual do volume faturado em relação à meta do mês"
        />

        {/* Tendência de Fechamento */}
        <ExecutiveKpiCard
          title="Tendência Fechamento"
          value="985"
          unit="t"
          secondaryValue="Projeção 98,5% da meta"
          comparisonText="Conservador 925 t | Otimista 1.045 t"
          comparisonType="positive"
          statusColor="primary"
          tooltip="Projeção estatística baseada no ritmo diário atual"
        />

        {/* Cobertura da Meta */}
        <ExecutiveKpiCard
          title="Cobertura da Meta"
          value="1,50x"
          secondaryValue="Pipeline 420 t ÷ Gap 280 t"
          comparisonText="Zona Confortável (>1,5x)"
          comparisonType="positive"
          statusColor="emerald"
          badge={{ text: 'Confortável', variant: 'success' }}
          tooltip="Relação entre o pipeline qualificado e o gap restante para a meta"
        />

        {/* Risco de Não Atingimento */}
        <ExecutiveKpiCard
          title="Risco Não Atingimento"
          value="Baixo"
          secondaryValue="Score: 28 de 100 pts"
          comparisonText="-12 pts vs. mês anterior"
          comparisonType="positive"
          statusColor="emerald"
          tooltip="Avaliação de risco multissistema: ritmo, crédito, estoque e pipeline"
        />

        {/* Clientes Ativos */}
        <ExecutiveKpiCard
          title="Clientes Ativos"
          value="34"
          unit="clientes"
          secondaryValue="Meta: 36 clientes ativos"
          comparisonText="+2 novos clientes ativados no mês"
          comparisonType="positive"
          statusColor="primary"
          tooltip="Clientes com pelo menos 1 pedido faturado nos últimos 30 dias"
        />

        {/* Conversão de Cotações */}
        <ExecutiveKpiCard
          title="Conversão de Cotações"
          value="68,5%"
          secondaryValue="Média da Equipe: 62,0%"
          comparisonText="+6,5% vs. média da equipe"
          comparisonType="positive"
          statusColor="emerald"
          tooltip="Proporção de cotações emitidas convertidas em pedidos SAP"
        />

        {/* Novos Clientes */}
        <ExecutiveKpiCard
          title="Novos Clientes"
          value="4"
          unit="novos"
          secondaryValue="Meta: 3 novos clientes"
          comparisonText="+1 acima da meta do trimestre"
          comparisonType="positive"
          statusColor="primary"
          tooltip="Contas com primeira compra faturada no ano corrente"
        />

        {/* Clientes Reativados */}
        <ExecutiveKpiCard
          title="Clientes Reativados"
          value="3"
          unit="reativados"
          secondaryValue="Meta: 4 reativações"
          comparisonText="+1 reativação em andamento"
          comparisonType="neutral"
          statusColor="primary"
          tooltip="Contas sem compras há mais de 90 dias que voltaram a comprar"
        />
      </div>

      {/* 4. SEÇÃO DO TERMÔMETRO DA META & RITMO ATUAL × NECESSÁRIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GoalThermometer
          goalMetrics={cockpitCommercialService.getGoalPaceMetrics()}
          unit={metricMode === 'VOLUME' ? 'TONS' : 'REVENUE'}
        />

        <PaceComparisonWidget
          goalMetrics={cockpitCommercialService.getGoalPaceMetrics()}
          unit={metricMode === 'VOLUME' ? 'TONS' : 'REVENUE'}
        />
      </div>

      {/* 5. GRÁFICO PRINCIPAL COMPOSTO (BARRAS + LINHAS + ÁREA RACHURADA DE GAP) */}
      <ExecutiveMainChart
        title="Evolução Mensal & YTD — Volume Faturado (t)"
        subtitle="Barras = Realizado | Linha Laranja = Meta | Linha Pontilhada = Tendência / Projeção | Rachurado = Gap"
        data={MOCK_MONTHLY_CHART_DATA}
        metricMode={metricMode}
        onMetricModeChange={setMetricMode}
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        onBarClick={(point) => {
          handleOpenDrilldown({
            id: 'cli-01',
            name: `Visão Analítica do Período ${point.label}`,
            volumeTons: point.realizado,
          })
        }}
      />

      {/* 6. BLOCO DE INTELIGÊNCIA ARTIFICIAL INTEGRADA (DIAGNÓSTICO EXECUTIVO & NEXT BEST ACTIONS) */}
      <ExecutiveAIInsightsBlock
        summary="A performance de vendas do consultor encontra-se em ritmo acelerado (+51,4 t/dia), com projeção provável de fechamento em 985 t (98,5% da meta). A cobertura de pipeline qualificado (1,50x) é saudável e garante sustentação para superar 1.000 t, desde que as 2 propostas de Perfis W e Chapas A36 sejam concluídas nos próximos 4 dias úteis."
        attentionPoints={[
          '🔴 Metais Betim (Curva A) completou 42 dias sem recompra, gerando gap de 52 t em chapas grossas.',
          '🟠 Estoque físico de Tubos Sch40 atingiu 3,5 t (baixo saldo) — requer confirmação da programação do laminador PCP para 28/10.',
          '🟠 5 cotações estão paradas há mais de 48 horas no CRM, totalizando 115 t com risco de esfriamento.',
        ]}
        opportunities={[
          '🟢 Estruturas Metálicas Triângulo aprovou proposta de 85 t de Perfis Laminados W para fechamento imediato.',
          '🟢 A taxa de conversão na linha de perfis atingiu 74,0%, superando a média geral da equipe (62,0%).',
          '🟢 2 contas inativas tiveram crédito revalidado no SAP ECC, abrindo espaço para reativação de 70 t.',
        ]}
        actions={aiActions}
        onExecuteAction={(action) => {
          toast.success(`Executando ação recomendada: ${action.title}`)
        }}
      />

      {/* 7. MÓDULO "VOU ATINGIR MINHA META?" & COBERTURA DE PIPELINE / RISCO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetaPredictionModule
          realizadoAtual={realizadoAtual}
          metaTotal={metaTotal}
          diasUteisPassados={diasPassados}
          diasUteisRestantes={diasRestantes}
          pipelineQualificado={pipelineQualificado}
          conversaoHistorica={68.5}
          unidade="t"
        />

        <MetaCoverageRiskWidget
          gapRestanteTons={gapRestante}
          pipelineTotalTons={pipelineTotal}
          pipelineQualificadoTons={pipelineQualificado}
          pipelinePonderadoTons={pipelinePonderado}
          taxaConversao={68.5}
          diasUteisRestantes={diasRestantes}
        />
      </div>

      {/* 8. DECOMPOSIÇÃO DO GAP & PLANO DE RECUPERAÇÃO DA META */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GapDecompositionPanel
          totalGapTons={gapRestante}
          items={DEFAULT_GAP_BREAKDOWN}
          onExecuteAction={(item) => {
            toast.success(`Ação corretiva disparada para: ${item.title}`)
          }}
        />

        <MetaActionPlanModule
          metaRestanteTons={gapRestante}
          items={MOCK_RECOVERY_ITEMS}
          onExecuteItem={(item) => {
            toast.success(`Iniciando plano de recuperação: ${item.title}`)
          }}
        />
      </div>

      {/* 9. IMPACTO POSITIVO E NEGATIVO & RADAR DE CLIENTES */}
      <div className="grid grid-cols-1 gap-6">
        <PositiveNegativeImpactPanel
          positiveContributors={MOCK_POSITIVE_CONTRIBUTORS}
          negativeContributors={MOCK_NEGATIVE_CONTRIBUTORS}
          onSelectEntity={(entity) => handleOpenDrilldown(entity)}
        />

        <ClientRadarWidget
          clients={MOCK_RADAR_CLIENTS}
          onSelectClient={(client) => handleOpenDrilldown(client)}
        />
      </div>

      {/* 10. INTEGRAÇÃO COM COTAÇÕES & ALERTAS PROATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuotationIntegrationTracker
          quotes={MOCK_TRACKED_QUOTES}
          onSelectQuote={(quote) => {
            toast.info(`Abrindo cotação ${quote.code} (${quote.clientName})`)
          }}
          onRequestStockCheck={(quote) => {
            toast.success(
              `Solicitação de checagem PCP enviada para lote de ${quote.productDescription}`,
            )
          }}
        />

        <ProactiveAlertsSection
          alerts={MOCK_PROACTIVE_ALERTS}
          onExecuteAlert={(alert) => {
            toast.info(`Ação executada: ${alert.actionLabel}`)
          }}
        />
      </div>

      {/* DRAWER DE DRILL-DOWN ANALÍTICO */}
      <CommercialDrilldownDrawer
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        data={drilldownData}
        onDrillNext={(targetLevel, item) => {
          const nextData = getRealDrilldownData({
            level: targetLevel,
            id: item.id,
            customerName: item.title,
          })
          setDrilldownData(nextData)
        }}
        onNavigateToEntity={(level, id) => {
          if (level === 'CLIENTE') {
            navigate(`/crm/${id}`)
          } else {
            toast.success(`Navegando para o registro ${id} no CRM 360º`)
          }
        }}
      />
    </div>
  )
}
