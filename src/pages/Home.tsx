import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Sparkles,
  Building2,
  RefreshCw,
  TrendingUp,
  Target,
  FileSpreadsheet,
  Layers,
  Scale,
  Calendar,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { cockpitCommercialService } from '@/services/cockpit_commercial_service'
import { SellerDailyCockpitHeader } from '@/components/analytics/SellerDailyCockpitHeader'
import { GoalThermometer } from '@/components/analytics/GoalThermometer'
import { PaceComparisonWidget } from '@/components/analytics/PaceComparisonWidget'
import { PortfolioHealthConcentrationCard } from '@/components/analytics/PortfolioHealthConcentrationCard'
import { OitfCockpitCard } from '@/components/analytics/OitfCockpitCard'
import { MinhaAgendaWidget } from '@/components/analytics/MinhaAgendaWidget'
import { LogisticsAttentionBlock } from '@/components/analytics/LogisticsAttentionBlock'
import { PriorityCommercialActionsBlock } from '@/components/analytics/PriorityCommercialActionsBlock'
import { fredTmsService, type FredDeliveryException } from '@/services/fred_tms_service'
import { PriorityQuotationsCarousel } from '@/components/analytics/PriorityQuotationsCarousel'
import { CommercialOpportunitiesCarousel } from '@/components/analytics/CommercialOpportunitiesCarousel'
import { ExecutiveAIBriefingBlock } from '@/components/analytics/ExecutiveAIBriefingBlock'
import { CommercialDrilldownModal } from '@/components/analytics/CommercialDrilldownModal'
import { CommercialMetricToggle } from '@/components/shared/CommercialMetricToggle'
import type { CommercialUnit } from '@/types/cockpit'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Seletor Global R$/t
  const [unit, setUnit] = useState<CommercialUnit>('REVENUE')
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Drilldown Modal
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const [drilldownType, setDrilldownType] = useState<string>('TOTAIS')
  const [drilldownTitle, setDrilldownTitle] = useState<string>('Relação de Clientes')
  const [drilldownSubtitle, setDrilldownSubtitle] = useState<string>('')

  // Identificação e RLS
  const userRole = (user?.role || '').toLowerCase()
  const userId = user?.id || 'qas-vendedor_teste'
  const isVendedorOnly = userRole === 'vendedor' || userRole === 'representante_externo'

  // Dados do Cockpit Comercial
  const portfolioCustomers = useMemo(() => {
    return cockpitCommercialService.getPortfolioCustomers(userId, userRole)
  }, [userId, userRole])

  const coverageMetrics = useMemo(() => {
    return cockpitCommercialService.getPortfolioCoverage(portfolioCustomers, 65)
  }, [portfolioCustomers])

  const goalMetrics = useMemo(() => {
    return cockpitCommercialService.getGoalPaceMetrics(userId, userRole)
  }, [userId, userRole])

  const oitfMetrics = useMemo(() => {
    return cockpitCommercialService.getOitfMetrics()
  }, [])

  const appointments = useMemo(() => {
    return cockpitCommercialService.getCorporateAgenda()
  }, [])

  const [tmsExceptions, setTmsExceptions] = useState<FredDeliveryException[]>([])

  useEffect(() => {
    fredTmsService.getDeliveryExceptions().then((res) => {
      setTmsExceptions(res)
    })
  }, [])

  const [aiActions, setAiActions] = useState(() => {
    return cockpitCommercialService.getPriorityAiActions()
  })

  const priorityQuotations = useMemo(() => {
    return cockpitCommercialService.getPriorityQuotations()
  }, [])

  const commercialOpportunities = useMemo(() => {
    return cockpitCommercialService.getCommercialOpportunities()
  }, [])

  const executiveBriefing = useMemo(() => {
    return cockpitCommercialService.getExecutiveAiBriefing(goalMetrics, coverageMetrics, unit)
  }, [goalMetrics, coverageMetrics, unit])

  // Drill-down filtering
  const drilldownFilteredCustomers = useMemo(() => {
    switch (drilldownType) {
      case 'ATIVOS':
        return portfolioCustomers.filter((c) => c.statusAtividadeMes.isAtivoMes)
      case 'PEDIDO':
        return portfolioCustomers.filter((c) => c.statusAtividadeMes.comPedido)
      case 'FATURAMENTO':
        return portfolioCustomers.filter((c) => c.statusAtividadeMes.comFaturamento)
      case 'CONTATO':
        return portfolioCustomers.filter((c) => c.statusAtividadeMes.comContato)
      case 'SEM_MOVIMENTACAO':
        return portfolioCustomers.filter((c) => !c.statusAtividadeMes.isAtivoMes)
      case 'COBERTURA':
        return portfolioCustomers
      default:
        return portfolioCustomers
    }
  }, [drilldownType, portfolioCustomers])

  const handleHeaderDrilldown = (type: string) => {
    setDrilldownType(type)
    switch (type) {
      case 'TOTAIS':
        setDrilldownTitle('Clientes Totais da Carteira')
        setDrilldownSubtitle(
          'Relação completa de todos os clientes cadastrados sob sua responsabilidade',
        )
        break
      case 'ATIVOS':
        setDrilldownTitle('Clientes Ativos no Mês (Únicos)')
        setDrilldownSubtitle(
          'Clientes com pelo menos 1 atividade válida no mês (Pedido, Faturamento, Contato ou Cotação)',
        )
        break
      case 'COBERTURA':
        setDrilldownTitle('Análise de Cobertura da Carteira')
        setDrilldownSubtitle('Visão analítica de cobertura cadastrada vs atingimento de metas')
        break
      case 'PEDIDO':
        setDrilldownTitle('Clientes com Pedido Emitido no Mês')
        setDrilldownSubtitle('Clientes que geraram novas ordens de venda (SAP SD) no período')
        break
      case 'FATURAMENTO':
        setDrilldownTitle('Clientes com Faturamento Efetivado no Mês')
        setDrilldownSubtitle('Clientes com notas fiscais faturadas no período corrente')
        break
      case 'CONTATO':
        setDrilldownTitle('Clientes Contatados no Mês')
        setDrilldownSubtitle(
          'Interações comerciais registradas (WhatsApp, Telefone, E-mail ou Visita)',
        )
        break
      case 'SEM_MOVIMENTACAO':
        setDrilldownTitle('Clientes SEM Movimentação no Mês (Atenção Máxima)')
        setDrilldownSubtitle(
          'Drill-down obrigatório: clientes sem pedido, sem faturamento e sem contato no mês',
        )
        break
      case 'META':
      case 'ATINGIMENTO':
        setDrilldownTitle('Detalhamento de Clientes & Contribuição da Meta')
        setDrilldownSubtitle('Clientes ordenados pelo volume faturado e atingimento comercial')
        break
      case 'OITF':
        setDrilldownTitle('Auditoria de Entregas & OITF')
        setDrilldownSubtitle('Cruzamento de pedidos SAP ECC, PCP Robotizado, WMS e TMS')
        break
      default:
        setDrilldownTitle('Detalhamento da Carteira')
        setDrilldownSubtitle('')
    }
    setDrilldownOpen(true)
  }

  const handleRecalculateAi = () => {
    setIsRecalculating(true)
    toast.info('Recalculando prioridades comerciais com IA (Meta, Gap, Estoque WMS, PCP e TMS)...')
    setTimeout(() => {
      setAiActions(cockpitCommercialService.getPriorityAiActions())
      setIsRecalculating(false)
      toast.success('Prioridades e oportunidades recalculadas com sucesso!')
    }, 800)
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 animate-fade-in pb-16">
      {/* 1. SELETOR GLOBAL R$/t & TOPO DO COCKPIT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  Meu Dia · Cockpit Comercial
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                >
                  {isVendedorOnly ? 'Vendedor Sênior' : 'Painel Executivo 360º'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
                Olá, <strong>{user?.name || 'Carlos Mendonça'}</strong>. Painel diário de
                visualização, exceção, decisão e ação.
              </p>
            </div>
          </div>
        </div>

        {/* Controles do Topo: SELETOR R$/t + Recalcular IA + Ver Carteira */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor Global R$ / t */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-border/50 shadow-xs">
            <button
              type="button"
              onClick={() => setUnit('REVENUE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                unit === 'REVENUE'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              R$ Financeiro
            </button>
            <button
              type="button"
              onClick={() => setUnit('TONS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                unit === 'TONS'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              t Volume
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateAi}
            disabled={isRecalculating}
            className="h-9 gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalcular Ações
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/crm')}
            className="h-9 gap-1.5 text-xs bg-primary text-white rounded-xl shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            Ver Carteira Completa
          </Button>
        </div>
      </div>

      {/* 2. CABEÇALHO EXECUTIVO COM 10 KPIS CLICÁVEIS */}
      <SellerDailyCockpitHeader
        coverageMetrics={coverageMetrics}
        goalMetrics={goalMetrics}
        oitfPct={oitfMetrics.atualPct}
        unit={unit}
        onDrilldownClick={handleHeaderDrilldown}
      />

      {/* 3. BRIEFING EXECUTIVO DA CARTEIRA GERADO POR IA */}
      <ExecutiveAIBriefingBlock briefingText={executiveBriefing} unit={unit} />

      {/* 4. BLOCO CENTRAL: TERMÔMETRO DE ATINGIMENTO & RITMO COMERCIAL DIÁRIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GoalThermometer goalMetrics={goalMetrics} unit={unit} />
        <PaceComparisonWidget goalMetrics={goalMetrics} unit={unit} />
      </div>

      {/* 5. BLOCO: SAÚDE & CONCENTRAÇÃO DA CARTEIRA (COM COBERTURA PONDERADA ABC) */}
      <PortfolioHealthConcentrationCard
        coverageMetrics={coverageMetrics}
        unit={unit}
        onOpenDrilldown={(type) => handleHeaderDrilldown(type)}
      />

      {/* 6. BLOCO: OITF (ON-TIME IN-FULL) COM AUDITORIA DE ENTREGAS CRUZADA */}
      <OitfCockpitCard oitfMetrics={oitfMetrics} />

      {/* 6.1 BLOCO: ENTREGAS & LOGÍSTICA COM ATENÇÃO (TMS / AGENTE FRED) */}
      <LogisticsAttentionBlock exceptions={tmsExceptions} />

      {/* 7. BLOCO: MINHA AGENDA DE HOJE (INTEGRADA À AGENDA CORPORATIVA DO HUB) */}
      <MinhaAgendaWidget appointments={appointments} onOpenNewModal={() => navigate('/crm')} />

      {/* 8. BLOCO: AÇÕES PRIORITÁRIAS DA IA (AÇÕES CONCRETAS) */}
      <PriorityCommercialActionsBlock
        actions={aiActions}
        unit={unit}
        onRecalculate={handleRecalculateAi}
        isRecalculating={isRecalculating}
        onActionComplete={(id) => {
          setAiActions((prev) => prev.map((a) => (a.id === id ? { ...a, concluida: true } : a)))
        }}
      />

      {/* 9. CARROSSEL DE COTAÇÕES PRIORITÁRIAS */}
      <PriorityQuotationsCarousel quotations={priorityQuotations} unit={unit} />

      {/* 10. CARROSSEL DE OPORTUNIDADES COMERCIAIS (MOTOR DE RECOMENDAÇÃO) */}
      <CommercialOpportunitiesCarousel opportunities={commercialOpportunities} unit={unit} />

      {/* DRILL-DOWN MODAL UNIVERSAL PARA TODOS OS KPIS */}
      <CommercialDrilldownModal
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        title={drilldownTitle}
        subtitle={drilldownSubtitle}
        customers={drilldownFilteredCustomers}
        unit={unit}
      />
    </div>
  )
}
