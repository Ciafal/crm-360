import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  SopForecastRecord,
  SopExecutivePlan,
  SopMeeting,
  SopScenarioSimulation,
  FvaMetricSummary,
  UnitType,
  SopGlobalFilter,
} from '@/types/sop'
import {
  sopService,
  QLIK_LAST_SYNC,
  SAP_LAST_SYNC,
  WMS_LAST_SYNC,
  PCP_LAST_SYNC,
  TMS_LAST_SYNC,
} from '@/services/sop_service'
import { SopExecutiveHeaderCards } from '@/components/sop/SopExecutiveHeaderCards'
import { SopForecastLayersTable } from '@/components/sop/SopForecastLayersTable'
import { SopExecutiveDashboardView } from '@/components/sop/SopExecutiveDashboardView'
import { SopGridModeView } from '@/components/sop/SopGridModeView'
import { SopFvaPanel } from '@/components/sop/SopFvaPanel'
import { SopScenariosView } from '@/components/sop/SopScenariosView'
import { SopMeetingView } from '@/components/sop/SopMeetingView'
import { SopSellerPlanningView } from '@/components/sop/SopSellerPlanningView'
import {
  TrendingUp,
  Layers,
  Factory,
  Table as TableIcon,
  Award,
  SlidersHorizontal,
  Calendar,
  UserCheck,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Database,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function PlanejamentoSop() {
  const { user } = useAuth()
  const userRole = user?.profile || 'gerente_comercial'
  const userName = user?.name || 'Roberto Silveira'
  const userId = user?.id || 'qas-gerente_teste'

  // Estados Globais do Submódulo
  const [activeTab, setActiveTab] = useState<string>('visao-geral')
  const [unit, setUnit] = useState<UnitType>('t')
  const [filters, setFilters] = useState<SopGlobalFilter>({
    cycleYearMonth: '2026-03',
    horizon: '1M',
    unit: 't',
    sellerId: 'ALL',
    productFamily: 'ALL',
    customerId: 'ALL',
    scenario: 'CONSENSUAL',
    revision: 'LATEST',
  })

  // Dados Carregados
  const [records, setRecords] = useState<SopForecastRecord[]>([])
  const [plan, setPlan] = useState<SopExecutivePlan | null>(null)
  const [meeting, setMeeting] = useState<SopMeeting | null>(null)
  const [scenarios, setScenarios] = useState<SopScenarioSimulation[]>([])
  const [fvaSummaries, setFvaSummaries] = useState<FvaMetricSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadAllData = async () => {
    try {
      const [fetchedRecords, fetchedPlan, fetchedMeeting, fetchedScenarios, fetchedFva] =
        await Promise.all([
          sopService.getForecastRecords(filters, userRole, userId),
          sopService.getExecutivePlan(filters.cycleYearMonth),
          sopService.getSopMeeting(filters.cycleYearMonth),
          sopService.getScenarios(),
          sopService.getFvaSummary(),
        ])

      setRecords(fetchedRecords)
      setPlan(fetchedPlan)
      setMeeting(fetchedMeeting)
      setScenarios(fetchedScenarios)
      setFvaSummaries(fetchedFva)
    } catch {
      toast.error('Erro ao sincronizar dados de S&OP.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [filters, userRole, userId])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAllData()
    toast.success('Dados consolidados de QLIK, SAP, WMS, PCP e TMS sincronizados com sucesso!')
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. BARRA DE STATUS & GOVERNANÇA DE FONTES CIAFAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-border/60 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-md bg-primary text-white">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h1 className="font-serif text-xl font-bold text-primary tracking-tight">
              Planejamento de Vendas & S&OP
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
              Ciclo Oficial: Março/2026
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3 mr-1" /> RLS Ativo ({userRole})
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>
              Passado: <strong>QLIK</strong> ({QLIK_LAST_SYNC})
            </span>
            <span>•</span>
            <span>
              Presente ERP: <strong>SAP ECC</strong>
            </span>
            <span>•</span>
            <span>
              Estoque: <strong>WMS</strong>
            </span>
            <span>•</span>
            <span>
              Produção: <strong>PCP Robotizado</strong>
            </span>
            <span>•</span>
            <span>
              Logística: <strong>TMS</strong>
            </span>
          </p>
        </div>

        {/* CONTROLES: UNIDADE (t / R$) E ATUALIZAR */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Alternância Global t / R$ */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-border/60">
            <button
              onClick={() => setUnit('t')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                unit === 't'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-slate-800',
              )}
            >
              t (Toneladas)
            </button>
            <button
              onClick={() => setUnit('brl')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                unit === 'brl'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-slate-800',
              )}
            >
              R$ (Faturamento)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/60 bg-white"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-primary', isRefreshing && 'animate-spin')} />
            Atualizar Carga QLIK
          </Button>
        </div>
      </div>

      {/* 2. CARDS EXECUTIVOS TOPO (FORECAST, META, CARTEIRA, PCP, ESTOQUE, FVA) */}
      {plan && (
        <SopExecutiveHeaderCards
          plan={plan}
          unit={unit}
          selectedCard={activeTab}
          onCardClick={(key) => {
            if (key === 'forecast' || key === 'meta') setActiveTab('forecast-comercial')
            else if (key === 'carteira' || key === 'producao' || key === 'faturamento')
              setActiveTab('sop-executivo')
            else if (key === 'fva') setActiveTab('forecast-value-add')
          }}
        />
      )}

      {/* 3. NAVEGAÇÃO DE SUBTÓPICOS DO SUBMÓDULO */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 rounded-2xl border border-border/60 shadow-xs h-auto flex flex-wrap gap-1 justify-start">
          <TabsTrigger
            value="visao-geral"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="forecast-comercial"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <Layers className="w-3.5 h-3.5" /> Forecast Comercial (F0-F4)
          </TabsTrigger>
          <TabsTrigger
            value="sop-executivo"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <Factory className="w-3.5 h-3.5" /> S&OP Executivo & Waterfall
          </TabsTrigger>
          <TabsTrigger
            value="modo-grade"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <TableIcon className="w-3.5 h-3.5" /> Modo Grade (Jan..Dez)
          </TabsTrigger>
          <TabsTrigger
            value="planejamento-vendedor"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <UserCheck className="w-3.5 h-3.5" /> Planejamento do Vendedor
          </TabsTrigger>
          <TabsTrigger
            value="forecast-value-add"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <Award className="w-3.5 h-3.5" /> Forecast Value Add (FVA)
          </TabsTrigger>
          <TabsTrigger
            value="cenarios"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Cenários "E Se?"
          </TabsTrigger>
          <TabsTrigger
            value="reuniao-sop"
            className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
          >
            <Calendar className="w-3.5 h-3.5" /> Reunião S&OP & ATA
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-6">
          {plan && <SopExecutiveDashboardView plan={plan} unit={unit} />}
          <SopForecastLayersTable
            records={records}
            unit={unit}
            onRecordUpdated={loadAllData}
            userRole={userRole}
            userName={userName}
          />
        </TabsContent>

        {/* ABA 2: FORECAST COMERCIAL (F0-F4) */}
        <TabsContent value="forecast-comercial" className="space-y-6">
          <SopForecastLayersTable
            records={records}
            unit={unit}
            onRecordUpdated={loadAllData}
            userRole={userRole}
            userName={userName}
          />
        </TabsContent>

        {/* ABA 3: S&OP EXECUTIVO & WATERFALL */}
        <TabsContent value="sop-executivo" className="space-y-6">
          {plan && <SopExecutiveDashboardView plan={plan} unit={unit} />}
        </TabsContent>

        {/* ABA 4: MODO GRADE */}
        <TabsContent value="modo-grade" className="space-y-6">
          <SopGridModeView records={records} unit={unit} userRole={userRole} />
        </TabsContent>

        {/* ABA 5: PLANEJAMENTO DO VENDEDOR */}
        <TabsContent value="planejamento-vendedor" className="space-y-6">
          <SopSellerPlanningView
            records={records}
            unit={unit}
            onRecordUpdated={loadAllData}
            userRole={userRole}
            userName={userName}
          />
        </TabsContent>

        {/* ABA 6: FORECAST VALUE ADD */}
        <TabsContent value="forecast-value-add" className="space-y-6">
          <SopFvaPanel fvaSummaries={fvaSummaries} />
        </TabsContent>

        {/* ABA 7: CENÁRIOS */}
        <TabsContent value="cenarios" className="space-y-6">
          <SopScenariosView
            scenarios={scenarios}
            onScenarioCreated={loadAllData}
            userRole={userRole}
            userName={userName}
          />
        </TabsContent>

        {/* ABA 8: REUNIÃO S&OP */}
        <TabsContent value="reuniao-sop" className="space-y-6">
          {meeting && plan && <SopMeetingView meeting={meeting} plan={plan} userRole={userRole} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
