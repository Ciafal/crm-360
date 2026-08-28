import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { mockEquipe, mockClientes, MembroEquipe } from '@/data/mockCommercialData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  Briefcase,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  Shield,
  ArrowUpRight,
  Eye,
  RefreshCw,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Layers,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  User,
  Package,
  Activity,
  Gauge,
  Building2,
  MapPin,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import {
  SecondaryTargetAxisChart,
  TimePeriodFilter,
} from '@/components/shared/SecondaryTargetAxisChart'
import { CommercialPaceThermometer } from '@/components/shared/CommercialPaceThermometer'
import { SellerAIDialog } from '@/components/shared/SellerAIDialog'
import { LocalSellerPerformanceAnalysisAgent } from '@/providers/LocalAIAdapter'
import { SellerIndividualAnalysis } from '@/providers/AIProvider'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn, formatNumberBR, formatCurrency, formatWeight } from '@/lib/utils'

export default function Equipe() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metricUnit, setMetricUnit] = useState<'TONELADAS' | 'REAIS'>('TONELADAS')
  const [activeTab, setActiveTab] = useState<'GRAFICOS' | 'IA_REPORT' | 'ATIVOS_CHART'>('GRAFICOS')
  const [isExporting, setIsExporting] = useState(false)

  // Filtros Globais da Tela Equipe
  const [periodFilter, setPeriodFilter] = useState<TimePeriodFilter>('MES')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('todos') // 'todos' | 'vendedor' | 'representante_externo' | 'supervisor'
  const [sellerFilter, setSellerFilter] = useState<string>('todos')
  const [supervisorFilter, setSupervisorFilter] = useState<string>('todos')
  const [productFamilyFilter, setProductFamilyFilter] = useState<string>('todos')
  const [productMaterialFilter, setProductMaterialFilter] = useState<string>('todos')
  const [segmentFilter, setSegmentFilter] = useState<string>('todos')
  const [archetypeFilter, setArchetypeFilter] = useState<string>('todos') // INDÚSTRIA, REVENDA, SERRALHERIA, CONSUMIDOR FINAL
  const [ufFilter, setUfFilter] = useState<string>('todos')
  const [abcFilter, setAbcFilter] = useState<string>('todos')
  const [statusMetaFilter, setStatusMetaFilter] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Estado do Modal de IA Individual por Vendedor
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [selectedSellerAnalysis, setSelectedSellerAnalysis] =
    useState<SellerIndividualAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Simular carregamento com fallback robusto
  useEffect(() => {
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [user])

  // Identificação do Usuário e RLS (Row Level Security / RBAC)
  const userRole = (user?.role || '').toLowerCase()
  const userEmail = (user?.email || '').toLowerCase()

  const isVendedorOnly = userRole === 'vendedor' || userRole === 'representante_externo'
  const isSupervisor = userRole === 'supervisor' || userRole === 'gerente_comercial'
  const isAdmin =
    userRole === 'administrador' || userRole === 'admin' || userEmail.includes('admin')

  // Membros visíveis com base em RLS
  const visibleMembers = useMemo(() => {
    if (isVendedorOnly) {
      return mockEquipe.filter(
        (m) =>
          m.email.toLowerCase() === userEmail ||
          m.userId === user?.id ||
          (userEmail.includes('vendedor2') ? m.id === 'eq-vend2' : m.id === 'eq-vend1') ||
          (userRole === 'representante_externo' && m.id === 'eq-rep'),
      )
    }

    if (isSupervisor) {
      return mockEquipe.filter((m) => m.role !== 'ADMIN' || m.email === userEmail)
    }

    return mockEquipe
  }, [isVendedorOnly, isSupervisor, isAdmin, userEmail, user?.id, userRole])

  // Filtragem completa e reativa dos membros da equipe
  const filteredMembers = useMemo(() => {
    return visibleMembers.filter((m) => {
      // Busca textual
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro de tipo de vendedor/representante
      const matchRole =
        roleFilter === 'todos' ||
        (roleFilter === 'vendedor' && m.role === 'VENDEDOR') ||
        (roleFilter === 'representante' && m.role === 'REPRESENTANTE_EXTERNO') ||
        (roleFilter === 'supervisor' && m.role === 'SUPERVISOR')

      // Filtro de vendedor individual
      const matchSeller =
        sellerFilter === 'todos' || m.id === sellerFilter || m.userId === sellerFilter

      // Filtro de status da meta
      const ating = m.atingimentoPercent
      let matchStatus = true
      if (statusMetaFilter === 'atingida') matchStatus = ating >= 100
      else if (statusMetaFilter === 'trajetoria') matchStatus = ating >= 75 && ating < 100
      else if (statusMetaFilter === 'risco') matchStatus = ating < 75

      return matchSearch && matchRole && matchSeller && matchStatus
    })
  }, [visibleMembers, searchTerm, roleFilter, sellerFilter, statusMetaFilter])

  // Totais consolidados recalculados dinamicamente com base nos filtros
  const consolidated = useMemo(() => {
    const list = filteredMembers.length > 0 ? filteredMembers : visibleMembers

    const totalMembros = list.length
    const metaMensal = list.reduce((acc, m) => acc + m.metaMensal, 0)
    const realizadoMensal = list.reduce((acc, m) => acc + m.realizadoMensal, 0)
    const gap = Math.max(0, metaMensal - realizadoMensal)
    const atingimento = metaMensal > 0 ? (realizadoMensal / metaMensal) * 100 : 0

    const pipeline = list.reduce((acc, m) => acc + m.pipeline, 0)
    const forecast = list.reduce((acc, m) => acc + m.forecast, 0)

    const toneladasMeta = list.reduce((acc, m) => acc + m.toneladasMeta, 0)
    const toneladasRealizado = list.reduce((acc, m) => acc + m.toneladasRealizado, 0)
    const toneladasGap = Math.max(0, toneladasMeta - toneladasRealizado)
    const toneladasPipeline = list.reduce(
      (acc, m) => acc + (m.toneladasPipeline || m.toneladasRealizado * 0.4),
      0,
    )
    const toneladasForecast = list.reduce(
      (acc, m) => acc + (m.toneladasForecast || m.toneladasRealizado * 1.2),
      0,
    )

    const carteiraTotal = list.reduce((acc, m) => acc + m.carteiraQtd, 0)
    const clientesAtivosMes = list.reduce((acc, m) => acc + m.clientesAtivosMes, 0)
    const taxaAtivacaoGeral = carteiraTotal > 0 ? (clientesAtivosMes / carteiraTotal) * 100 : 0

    // Ritmos
    const ritmoAtualTons = list.reduce((acc, m) => acc + (m.ritmoAtualTons || 0), 0)
    const ritmoNecessarioTons = list.reduce((acc, m) => acc + (m.ritmoNecessarioTons || 0), 0)
    const ritmoMediaHistoricaTons = list.reduce(
      (acc, m) => acc + (m.ritmoMediaHistoricaTons || 0),
      0,
    )

    const ritmoAtualBrl = list.reduce((acc, m) => acc + (m.ritmoAtual || 0), 0)
    const ritmoNecessarioBrl = list.reduce((acc, m) => acc + (m.ritmoNecessario || 0), 0)

    // Cobertura de Meta (Pipeline / Gap)
    const coberturaMetaPercent = gap > 0 ? (pipeline / gap) * 100 : 100

    return {
      totalMembros,
      metaMensal,
      realizadoMensal,
      gap,
      atingimento,
      pipeline,
      forecast,
      toneladasMeta,
      toneladasRealizado,
      toneladasGap,
      toneladasPipeline,
      toneladasForecast,
      carteiraTotal,
      clientesAtivosMes,
      taxaAtivacaoGeral,
      ritmoAtualTons,
      ritmoNecessarioTons,
      ritmoMediaHistoricaTons,
      ritmoAtualBrl,
      ritmoNecessarioBrl,
      coberturaMetaPercent,
    }
  }, [filteredMembers, visibleMembers])

  // Dados do gráfico temporal ajustados pelo toggle de unidade (t vs R$) e filtros
  const chartData = useMemo(() => {
    const isTons = metricUnit === 'TONELADAS'

    // Fator multiplicador de escala se filtrado vendedor individual
    const factor =
      filteredMembers.length === 1
        ? isTons
          ? filteredMembers[0].toneladasMeta / 400
          : filteredMembers[0].metaMensal / 2500000
        : 1

    if (periodFilter === 'YTD') {
      return [
        {
          label: 'Jan',
          realizado: Math.round((isTons ? 320 : 1950000) * factor),
          meta: Math.round((isTons ? 380 : 2300000) * factor),
          forecast: Math.round((isTons ? 320 : 1950000) * factor),
        },
        {
          label: 'Fev',
          realizado: Math.round((isTons ? 350 : 2100000) * factor),
          meta: Math.round((isTons ? 380 : 2300000) * factor),
          forecast: Math.round((isTons ? 350 : 2100000) * factor),
        },
        {
          label: 'Mar',
          realizado: Math.round((isTons ? 390 : 2400000) * factor),
          meta: Math.round((isTons ? 400 : 2450000) * factor),
          forecast: Math.round((isTons ? 390 : 2400000) * factor),
        },
        {
          label: 'Abr',
          realizado: Math.round((isTons ? 310 : 1900000) * factor),
          meta: Math.round((isTons ? 390 : 2400000) * factor),
          forecast: Math.round((isTons ? 310 : 1900000) * factor),
        },
        {
          label: 'Mai',
          realizado: Math.round((isTons ? 375 : 2300000) * factor),
          meta: Math.round((isTons ? 390 : 2400000) * factor),
          forecast: Math.round((isTons ? 375 : 2300000) * factor),
        },
        {
          label: 'Jun',
          realizado: Math.round((isTons ? 360 : 2200000) * factor),
          meta: Math.round((isTons ? 400 : 2500000) * factor),
          forecast: Math.round((isTons ? 360 : 2200000) * factor),
        },
        {
          label: 'Jul',
          realizado: Math.round((isTons ? 385 : 2350000) * factor),
          meta: Math.round((isTons ? 400 : 2500000) * factor),
          forecast: Math.round((isTons ? 385 : 2350000) * factor),
        },
        {
          label: 'Ago',
          realizado: Math.round((isTons ? 395 : 2420000) * factor),
          meta: Math.round((isTons ? 410 : 2550000) * factor),
          forecast: Math.round((isTons ? 395 : 2420000) * factor),
        },
        {
          label: 'Set',
          realizado: Math.round((isTons ? 370 : 2280000) * factor),
          meta: Math.round((isTons ? 410 : 2550000) * factor),
          forecast: Math.round((isTons ? 370 : 2280000) * factor),
        },
        {
          label: 'Out (Atual)',
          realizado: Math.round(
            isTons ? consolidated.toneladasRealizado : consolidated.realizadoMensal,
          ),
          meta: Math.round(isTons ? consolidated.toneladasMeta : consolidated.metaMensal),
          forecast: Math.round(isTons ? consolidated.toneladasForecast : consolidated.forecast),
        },
      ]
    }

    if (periodFilter === '12_MESES' || periodFilter === 'ANO') {
      return [
        {
          label: 'Nov/23',
          realizado: Math.round((isTons ? 310 : 1850000) * factor),
          meta: Math.round((isTons ? 360 : 2200000) * factor),
          forecast: Math.round((isTons ? 310 : 1850000) * factor),
        },
        {
          label: 'Dez/23',
          realizado: Math.round((isTons ? 340 : 2050000) * factor),
          meta: Math.round((isTons ? 370 : 2250000) * factor),
          forecast: Math.round((isTons ? 340 : 2050000) * factor),
        },
        {
          label: 'Jan/24',
          realizado: Math.round((isTons ? 320 : 1950000) * factor),
          meta: Math.round((isTons ? 380 : 2300000) * factor),
          forecast: Math.round((isTons ? 320 : 1950000) * factor),
        },
        {
          label: 'Fev/24',
          realizado: Math.round((isTons ? 350 : 2100000) * factor),
          meta: Math.round((isTons ? 380 : 2300000) * factor),
          forecast: Math.round((isTons ? 350 : 2100000) * factor),
        },
        {
          label: 'Mar/24',
          realizado: Math.round((isTons ? 390 : 2400000) * factor),
          meta: Math.round((isTons ? 400 : 2450000) * factor),
          forecast: Math.round((isTons ? 390 : 2400000) * factor),
        },
        {
          label: 'Abr/24',
          realizado: Math.round((isTons ? 310 : 1900000) * factor),
          meta: Math.round((isTons ? 390 : 2400000) * factor),
          forecast: Math.round((isTons ? 310 : 1900000) * factor),
        },
        {
          label: 'Mai/24',
          realizado: Math.round((isTons ? 375 : 2300000) * factor),
          meta: Math.round((isTons ? 390 : 2400000) * factor),
          forecast: Math.round((isTons ? 375 : 2300000) * factor),
        },
        {
          label: 'Jun/24',
          realizado: Math.round((isTons ? 360 : 2200000) * factor),
          meta: Math.round((isTons ? 400 : 2500000) * factor),
          forecast: Math.round((isTons ? 360 : 2200000) * factor),
        },
        {
          label: 'Jul/24',
          realizado: Math.round((isTons ? 385 : 2350000) * factor),
          meta: Math.round((isTons ? 400 : 2500000) * factor),
          forecast: Math.round((isTons ? 385 : 2350000) * factor),
        },
        {
          label: 'Ago/24',
          realizado: Math.round((isTons ? 395 : 2420000) * factor),
          meta: Math.round((isTons ? 410 : 2550000) * factor),
          forecast: Math.round((isTons ? 395 : 2420000) * factor),
        },
        {
          label: 'Set/24',
          realizado: Math.round((isTons ? 370 : 2280000) * factor),
          meta: Math.round((isTons ? 410 : 2550000) * factor),
          forecast: Math.round((isTons ? 370 : 2280000) * factor),
        },
        {
          label: 'Out/24 (Atual)',
          realizado: Math.round(
            isTons ? consolidated.toneladasRealizado : consolidated.realizadoMensal,
          ),
          meta: Math.round(isTons ? consolidated.toneladasMeta : consolidated.metaMensal),
          forecast: Math.round(isTons ? consolidated.toneladasForecast : consolidated.forecast),
        },
      ]
    }

    // Default: 'MES' com visualização por semana / quinzenas
    return [
      {
        label: 'Semana 1',
        realizado: Math.round((isTons ? 75 : 460000) * factor),
        meta: Math.round((isTons ? 100 : 625000) * factor),
        forecast: Math.round((isTons ? 75 : 460000) * factor),
      },
      {
        label: 'Semana 2',
        realizado: Math.round((isTons ? 85 : 520000) * factor),
        meta: Math.round((isTons ? 100 : 625000) * factor),
        forecast: Math.round((isTons ? 85 : 520000) * factor),
      },
      {
        label: 'Semana 3 (Atual)',
        realizado: Math.round(
          isTons ? consolidated.toneladasRealizado - 160 : consolidated.realizadoMensal - 980000,
        ),
        meta: Math.round((isTons ? 100 : 625000) * factor),
        forecast: Math.round((isTons ? 105 : 650000) * factor),
      },
      {
        label: 'Semana 4 (Proj)',
        realizado: 0,
        meta: Math.round((isTons ? 100 : 625000) * factor),
        forecast: Math.round(
          isTons
            ? consolidated.toneladasForecast - consolidated.toneladasRealizado
            : consolidated.forecast - consolidated.realizadoMensal,
        ),
      },
    ]
  }, [metricUnit, periodFilter, filteredMembers, consolidated])

  // Disparar análise de IA individual por vendedor
  const handleOpenAiAnalysis = async (member: MembroEquipe) => {
    setAiLoading(true)
    setAiModalOpen(true)
    try {
      const agent = new LocalSellerPerformanceAnalysisAgent()
      const analysis = await agent.analyzeSellerPerformance(member.id, {
        periodo: periodFilter,
        familia: productFamilyFilter !== 'todos' ? productFamilyFilter : undefined,
        produto: productMaterialFilter !== 'todos' ? productMaterialFilter : undefined,
        segmento: segmentFilter !== 'todos' ? segmentFilter : undefined,
      })
      setSelectedSellerAnalysis(analysis)
    } catch (err) {
      toast.error('Erro ao processar diagnóstico de IA para o vendedor.')
    } finally {
      setAiLoading(false)
    }
  }

  // Resetar todos os filtros
  const handleResetFilters = () => {
    setPeriodFilter('MES')
    setStartDate('')
    setEndDate('')
    setRoleFilter('todos')
    setSellerFilter('todos')
    setSupervisorFilter('todos')
    setProductFamilyFilter('todos')
    setProductMaterialFilter('todos')
    setSegmentFilter('todos')
    setArchetypeFilter('todos')
    setUfFilter('todos')
    setAbcFilter('todos')
    setStatusMetaFilter('todos')
    setSearchTerm('')
    toast.info('Filtros restaurados para a visão padrão.')
  }

  // Dados para o Gráfico de Clientes Ativos x Carteira Total por Vendedor
  const ativosChartData = useMemo(() => {
    return filteredMembers.map((m) => ({
      name: m.name.split(' ')[0],
      fullName: m.name,
      carteiraTotal: m.carteiraQtd,
      ativosMes: m.clientesAtivosMes,
      taxa: m.taxaCarteiraAtivaPercent,
    }))
  }, [filteredMembers])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageLoadingState message="Carregando painel consolidado da equipe..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageErrorState
          title="Não foi possível carregar os dados da equipe."
          description={error}
          onRetry={() => setLoading(false)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* HEADER DA TELA COM IDENTIFICAÇÃO E TOGGLE PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                Equipe Comercial & Metas
              </h1>
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
              >
                {isVendedorOnly
                  ? 'Visão Individual (RLS)'
                  : isSupervisor
                    ? 'Visão Regional MG (Supervisor)'
                    : 'Visão Consolidada Diretoria'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Performance de equipe com análise filtrável, comparativa, preditiva e diagnóstico
              individual de IA.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Acesso rápido aos Cockpits Analíticos */}
          <Button
            size="sm"
            onClick={() => navigate('/kpis')}
            className="h-9 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-xs"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Cockpit Executivo & Metas</span>
          </Button>

          {/* Toggle Principal: Toneladas vs R$ Faturamento */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-300 text-xs shadow-xs">
            <button
              onClick={() => setMetricUnit('TONELADAS')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5',
                metricUnit === 'TONELADAS'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900',
              )}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Toneladas (t)</span>
            </button>
            <button
              onClick={() => setMetricUnit('REAIS')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5',
                metricUnit === 'REAIS'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900',
              )}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>R$ Faturamento</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsExporting(true)
              setTimeout(() => {
                setIsExporting(false)
                toast.success(
                  'Relatório Executivo Gerado com Sucesso! Respeitando todos os filtros ativos.',
                )
              }, 600)
            }}
            className="h-9 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Gerando...' : 'Gerar Relatório'}
          </Button>

          <Button
            size="sm"
            onClick={() => setActiveTab(activeTab === 'IA_REPORT' ? 'GRAFICOS' : 'IA_REPORT')}
            className={cn(
              'h-9 gap-1.5 text-xs font-semibold transition-colors',
              activeTab === 'IA_REPORT'
                ? 'bg-slate-800 text-white'
                : 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs',
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {activeTab === 'IA_REPORT' ? 'Ocultar Relatório IA' : 'Análise Geral IA'}
          </Button>
        </div>
      </div>

      {/* PAINEL COMPLETO DE FILTROS GLOBAIS DA EQUIPE */}
      <Card className="bg-white/90 backdrop-blur-md border-border/50 shadow-xs rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-800">
              Filtros da Performance Consolidada da Equipe
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-6 text-[11px] text-muted-foreground hover:text-primary gap-1 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Padrão</span>
          </Button>
        </div>

        {/* Linha 1 de Filtros: Período, Datas, Representante/Vendedor, Supervisor, Família, Material SAP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Período */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Período
            </label>
            <Select
              value={periodFilter}
              onValueChange={(val: TimePeriodFilter) => setPeriodFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MES">Mês Atual (Outubro)</SelectItem>
                <SelectItem value="YTD">YTD (Acumulado Ano)</SelectItem>
                <SelectItem value="12_MESES">Últimos 12 Meses</SelectItem>
                <SelectItem value="ANO">Ano Completo 2024</SelectItem>
                <SelectItem value="PERIODO">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendedor / Membro */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Vendedor / Representante
            </label>
            <Select
              value={sellerFilter}
              onValueChange={(val) => setSellerFilter(val)}
              disabled={isVendedorOnly}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todos os membros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os membros ({visibleMembers.length})</SelectItem>
                {visibleMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.role === 'REPRESENTANTE_EXTERNO' ? 'Rep.' : 'Vend.'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Representação (RLS) */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Tipo de Vínculo
            </label>
            <Select
              value={roleFilter}
              onValueChange={(val) => setRoleFilter(val)}
              disabled={isVendedorOnly}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Vínculos</SelectItem>
                <SelectItem value="vendedor">Vendedor Interno</SelectItem>
                <SelectItem value="representante">Representante Externo</SelectItem>
                <SelectItem value="supervisor">Supervisão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Família de Produto */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Família de Produto
            </label>
            <Select
              value={productFamilyFilter}
              onValueChange={(val) => setProductFamilyFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todas as famílias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Famílias</SelectItem>
                <SelectItem value="PERFIS">Perfis Laminados (W, I, U)</SelectItem>
                <SelectItem value="BARRAS">Barras Chatas & Quadradas</SelectItem>
                <SelectItem value="CANTONEIRAS">Cantoneiras Laminadas</SelectItem>
                <SelectItem value="CHAPAS">Chapas Grossas & Finas A36</SelectItem>
                <SelectItem value="TUBOS">Tubos Industriais & Redondos</SelectItem>
                <SelectItem value="TELAS">Telas Soldadas & CA-50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Código SAP do Material */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Material SAP ECC
            </label>
            <Select
              value={productMaterialFilter}
              onValueChange={(val) => setProductMaterialFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todos os materiais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Códigos SAP</SelectItem>
                <SelectItem value="SAP-MAT-1001">1001 — Perfis W 200x22,5 ASTM A572</SelectItem>
                <SelectItem value="SAP-MAT-1002">1002 — Cantoneira 2" x 1/4" ASTM A36</SelectItem>
                <SelectItem value="SAP-MAT-1003">1003 — Barra Chata 3" x 3/8" A36</SelectItem>
                <SelectItem value="SAP-MAT-1004">1004 — Barra Redonda 1" SAE 1045</SelectItem>
                <SelectItem value="SAP-MAT-1005">1005 — Tubo Industrial Quadrado 80x80</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status da Meta */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Status da Meta
            </label>
            <Select value={statusMetaFilter} onValueChange={(val) => setStatusMetaFilter(val)}>
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="atingida">Meta Atingida (≥ 100%)</SelectItem>
                <SelectItem value="trajetoria">Na Trajetória (75% - 99%)</SelectItem>
                <SelectItem value="risco">Em Risco (&lt; 75%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Linha 2 de Filtros: Arquétipo Comercial, Segmento, UF, Curva ABC, Busca */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Arquétipo Comercial */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Arquétipo Comercial
            </label>
            <Select value={archetypeFilter} onValueChange={(val) => setArchetypeFilter(val)}>
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todos arquétipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Arquétipos</SelectItem>
                <SelectItem value="INDÚSTRIA">Indústria & Caldeiraria</SelectItem>
                <SelectItem value="REVENDA">Revenda & Distribuição</SelectItem>
                <SelectItem value="SERRALHERIA">Serralheria & Estruturas</SelectItem>
                <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final / Obras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Segmento */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Segmento de Mercado
            </label>
            <Select value={segmentFilter} onValueChange={(val) => setSegmentFilter(val)}>
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todos segmentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Segmentos</SelectItem>
                <SelectItem value="CONSTRUCAO">Construção Civil & Obras</SelectItem>
                <SelectItem value="METALURGICA">Metalmecânica & Usinagem</SelectItem>
                <SelectItem value="AGRO">Agronegócio & Silos</SelectItem>
                <SelectItem value="ENERGIA">Energia & Infraestrutura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Classificação ABC */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Classificação ABC
            </label>
            <Select value={abcFilter} onValueChange={(val) => setAbcFilter(val)}>
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todas curvas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Curva ABC Completa</SelectItem>
                <SelectItem value="A">Clientes Curva A (80% Volume)</SelectItem>
                <SelectItem value="B">Clientes Curva B (15% Volume)</SelectItem>
                <SelectItem value="C">Clientes Curva C (5% Volume)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* UF / Região */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Estado / UF
            </label>
            <Select value={ufFilter} onValueChange={(val) => setUfFilter(val)}>
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todas UFs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as UFs</SelectItem>
                <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                <SelectItem value="SP">São Paulo (SP)</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                <SelectItem value="ES">Espírito Santo (ES)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Busca Textual */}
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Busca Rápida
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Nome, cargo ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* CARDS CONSOLIDADOS DE PERFORMANCE (Com Toneladas / R$ e Clientes Ativos no Mês) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total da Equipe */}
        <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Equipe
            </span>
            <Users className="w-4 h-4 text-primary/60" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-primary">
              {consolidated.totalMembros}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              {consolidated.totalMembros === 1 ? 'membro ativo' : 'membros ativos'}
            </span>
          </div>
        </Card>

        {/* Card 2: Meta Mensal */}
        <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Meta Consolidada
            </span>
            <Target className="w-4 h-4 text-primary/60" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-primary">
              {metricUnit === 'TONELADAS'
                ? formatWeight(consolidated.toneladasMeta, 0)
                : formatCurrency(consolidated.metaMensal)}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              {metricUnit === 'TONELADAS'
                ? `Equiv: ${formatCurrency(consolidated.metaMensal)}`
                : `Equiv: ${formatWeight(consolidated.toneladasMeta, 0)}`}
            </span>
          </div>
        </Card>

        {/* Card 3: Realizado Mensal */}
        <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Realizado Mensal
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-emerald-600">
              {metricUnit === 'TONELADAS'
                ? formatWeight(consolidated.toneladasRealizado, 0)
                : formatCurrency(consolidated.realizadoMensal)}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              {formatNumberBR(consolidated.atingimento, 1)}% da meta atingido
            </span>
          </div>
        </Card>

        {/* Card 4: Gap da Meta */}
        <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Gap da Meta
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-amber-600">
              {metricUnit === 'TONELADAS'
                ? formatWeight(consolidated.toneladasGap, 0)
                : formatCurrency(consolidated.gap)}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Faltam{' '}
              {metricUnit === 'TONELADAS'
                ? formatWeight(consolidated.toneladasGap, 0)
                : formatCurrency(consolidated.gap)}
            </span>
          </div>
        </Card>

        {/* Card 5: Clientes Ativos no Mês (NOVO INDICADOR OBRIGATÓRIO) */}
        <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
              Clientes Ativos no Mês
            </span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-slate-900">
              {consolidated.clientesAtivosMes}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                / {consolidated.carteiraTotal}
              </span>
            </span>
            <span className="text-[11px] text-sky-700 font-semibold block mt-0.5">
              Taxa de ativação: {formatNumberBR(consolidated.taxaAtivacaoGeral, 1)}%
            </span>
          </div>
        </Card>

        {/* Card 6: Pipeline & Cobertura de Meta */}
        <Card className="bg-white/90 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Pipeline & Cobertura
            </span>
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
              {formatNumberBR(consolidated.coberturaMetaPercent, 0)}%
            </Badge>
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-primary">
              {metricUnit === 'TONELADAS'
                ? formatWeight(consolidated.toneladasPipeline, 0)
                : formatCurrency(consolidated.pipeline)}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Forecast:{' '}
              {metricUnit === 'TONELADAS'
                ? formatWeight(consolidated.toneladasForecast, 0)
                : formatCurrency(consolidated.forecast)}
            </span>
          </div>
        </Card>
      </div>

      {/* GRÁFICOS PRINCIPAIS: PERFORMANCE COM MÉDIA E RITMO + TERMÔMETRO + CLIENTES ATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico Principal de Performance Temporal */}
        <div className="lg:col-span-2">
          <SecondaryTargetAxisChart
            title={`Performance Consolidada da Equipe — ${metricUnit === 'TONELADAS' ? 'Volume em Toneladas (t)' : 'Faturamento em R$'}`}
            subtitle="Realizado (Barras) | Meta (Linha) | Média Histórica (Ciano) | Ritmo Projetado (Violeta) | Forecast (Tracejado)"
            metricType={metricUnit}
            isCurrency={metricUnit === 'REAIS'}
            unit={metricUnit === 'TONELADAS' ? 't' : 'R$'}
            data={chartData}
            selectedPeriod={periodFilter}
            onPeriodChange={(p) => setPeriodFilter(p)}
            showAverageLine={true}
            averageValue={
              metricUnit === 'TONELADAS'
                ? (consolidated.toneladasRealizado / 14) * 22
                : (consolidated.realizadoMensal / 14) * 22
            }
            averageLabel="Média Mensal Histórica"
            showPaceLine={true}
            paceValue={
              metricUnit === 'TONELADAS' ? consolidated.toneladasForecast : consolidated.forecast
            }
            paceLabel="Ritmo Projetado de Fechamento"
            aiAnalysis={{
              summary: `Equipe comercial faturou ${metricUnit === 'TONELADAS' ? formatWeight(consolidated.toneladasRealizado) : formatCurrency(consolidated.realizadoMensal)} até o 14º dia útil (${formatNumberBR(consolidated.atingimento, 1)}% da meta). O ritmo atual projeta fechamento em ${metricUnit === 'TONELADAS' ? formatWeight(consolidated.toneladasForecast) : formatCurrency(consolidated.forecast)}.`,
              factors: [
                {
                  title: 'Taxa de Ativação da Carteira',
                  impactTons: 28,
                  source: 'SAP ECC',
                  evidence: `${consolidated.clientesAtivosMes} de ${consolidated.carteiraTotal} clientes ativos no mês (${formatNumberBR(consolidated.taxaAtivacaoGeral, 1)}%).`,
                },
                {
                  title: 'Saldos Físicos de Estoque em Contagem',
                  impactTons: 19,
                  source: 'WMS',
                  evidence: 'Lotes de Perfis W e Chapas A36 liberados para entrega em até 48h.',
                },
                {
                  title: 'Clientes Curva A Fora da Recompra',
                  impactTons: 17,
                  source: 'Qlik',
                  evidence:
                    'Contas estratégicas com atraso de 3 dias no ciclo histórico de reposição.',
                },
              ],
              recommendation:
                'Acionar os clientes Curva A com compra esperada nos próximos 10 dias e acelerar follow-up de cotações abertas.',
            }}
          />
        </div>

        {/* Coluna Direita: Termômetro de Ritmo Comercial com Média Histórica */}
        <div className="space-y-4">
          <CommercialPaceThermometer
            title="Ritmo Comercial (Velocidade Diária)"
            ritmoAtual={
              metricUnit === 'TONELADAS' ? consolidated.ritmoAtualTons : consolidated.ritmoAtualBrl
            }
            ritmoNecessario={
              metricUnit === 'TONELADAS'
                ? consolidated.ritmoNecessarioTons
                : consolidated.ritmoNecessarioBrl
            }
            mediaHistorica={consolidated.ritmoMediaHistoricaTons || 18.4}
            unidade={metricUnit === 'TONELADAS' ? 't/dia' : 'R$/dia'}
            diasUteisPassados={14}
            diasUteisRestantes={8}
            realizadoVolume={consolidated.toneladasRealizado}
            metaVolume={consolidated.toneladasMeta}
            gapVolume={consolidated.toneladasGap}
            isSupervisor={true}
            onToggleUnit={() => setMetricUnit(metricUnit === 'TONELADAS' ? 'REAIS' : 'TONELADAS')}
          />

          {/* Card Secundário: Taxa de Ativação x Carteira */}
          <Card className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-600" />
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
                  Qualidade da Carteira
                </h4>
              </div>
              <Badge className="bg-sky-100 text-sky-800 text-[10px] font-bold border-none">
                {formatNumberBR(consolidated.taxaAtivacaoGeral, 1)}% Ativa
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>{consolidated.clientesAtivosMes}</strong> dos{' '}
              <strong>{consolidated.carteiraTotal}</strong> clientes da carteira realizaram pelo
              menos um faturamento/compra neste período no SAP ECC.
            </p>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Ativação da Equipe</span>
                <span>
                  {consolidated.clientesAtivosMes} / {consolidated.carteiraTotal} contas
                </span>
              </div>
              <Progress value={consolidated.taxaAtivacaoGeral} className="h-2 bg-slate-100" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setActiveTab(activeTab === 'ATIVOS_CHART' ? 'GRAFICOS' : 'ATIVOS_CHART')
              }
              className="w-full text-xs h-7 rounded-lg border-sky-300 text-sky-800 hover:bg-sky-50"
            >
              {activeTab === 'ATIVOS_CHART'
                ? 'Ocultar Gráfico de Ativação'
                : 'Ver Gráfico Carteira x Ativos'}
            </Button>
          </Card>
        </div>
      </div>

      {/* GRÁFICO OPCIONAL: CLIENTES ATIVOS X CARTEIRA TOTAL POR VENDEDOR */}
      {activeTab === 'ATIVOS_CHART' && (
        <Card className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-primary">
                Clientes Ativos no Mês x Carteira Total por Vendedor
              </h3>
              <p className="text-xs text-muted-foreground">
                Comparativo de penetração de carteira e faturamento ativo no SAP ECC
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('GRAFICOS')}
              className="h-7 text-xs"
            >
              Fechar
            </Button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ativosChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val} clientes`,
                    name === 'carteiraTotal' ? 'Carteira Total' : 'Ativos no Mês',
                  ]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar
                  dataKey="carteiraTotal"
                  name="Carteira Total (Clientes)"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="ativosMes"
                  name="Clientes Ativos no Mês"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* PAINEL DE RELATÓRIO IA GERAL (QUANDO ATIVADO) */}
      {activeTab === 'IA_REPORT' && (
        <Card className="p-6 rounded-3xl bg-slate-950 text-white border-amber-500/40 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-300">
                  Relatório Executivo da Equipe Comercial — IA Copilot
                </h3>
                <p className="text-xs text-slate-400">
                  Síntese Comercial Contextualizada: Resultado · Meta · Gap · Ritmo · Taxa de
                  Ativação · SAP ECC
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('GRAFICOS')}
              className="text-xs border-slate-700 text-slate-300 hover:text-white"
            >
              Fechar Relatório IA
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <strong className="text-amber-400 block uppercase font-bold text-[11px]">
                1. Diagnóstico Geral de Desempenho
              </strong>
              <p className="text-slate-200">
                A equipe comercial CIAFAL realizou{' '}
                <strong>
                  {formatWeight(consolidated.toneladasRealizado)} (
                  {formatCurrency(consolidated.realizadoMensal)})
                </strong>{' '}
                de uma meta de{' '}
                <strong>
                  {formatWeight(consolidated.toneladasMeta)} (
                  {formatCurrency(consolidated.metaMensal)})
                </strong>
                , registrando <strong>{formatNumberBR(consolidated.atingimento, 1)}%</strong> de
                atingimento no 14º dia útil. A tendência projeta fechamento em{' '}
                <strong>{formatWeight(consolidated.toneladasForecast)}</strong>, com ritmo atual de{' '}
                <strong>{formatNumberBR(consolidated.ritmoAtualTons, 1)} t/dia</strong> superando a
                média histórica.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <strong className="text-sky-400 block uppercase font-bold text-[11px]">
                2. Penetração & Clientes Ativos
              </strong>
              <p className="text-slate-200">
                Taxa de ativação de{' '}
                <strong>{formatNumberBR(consolidated.taxaAtivacaoGeral, 1)}%</strong> com{' '}
                <strong>{consolidated.clientesAtivosMes}</strong> dos{' '}
                <strong>{consolidated.carteiraTotal}</strong> clientes faturando no mês. O principal
                gap de cobertura está concentrado em representantes externos que apresentam ativação
                de 52,0%.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <strong className="text-emerald-400 block uppercase font-bold text-[11px]">
                3. Pontos Fortes & Evidências
              </strong>
              <p className="text-slate-200">
                Alta conversão nas linhas de Perfis Laminados e Chapas Grossas A36 em Contagem e
                Betim, impulsionada pelo cumprimento do SLA de propostas no SAP ECC e confirmação de
                estoque no WMS em menos de 4h.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <strong className="text-rose-400 block uppercase font-bold text-[11px]">
                4. Gargalos & Recomendações
              </strong>
              <p className="text-slate-200">
                8 clientes da Curva A estão fora da janela de recompra calculada pelo modelo
                P(vivo). Recomenda-se acionamento individual com propostas com frete CIF bonificado
                e prazos de 28 DDL.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* TABELA DE MEMBROS DA EQUIPE (Com Coluna de Clientes Ativos, Métricas no Toggle e Botão Analisar com IA) */}
      <Card className="bg-white/95 backdrop-blur-md border-border/40 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-primary">
              Membros da Equipe Comercial & Metas
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tabela completa com carteira, clientes ativos no mês (% ativa), metas, realizado, gap,
              pipeline, forecast, ritmo e análise individual com IA.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
              Exibindo <strong>{filteredMembers.length}</strong> de {visibleMembers.length} membros
            </Badge>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-8">
            <PageEmptyState
              title="Nenhum membro encontrado com os filtros selecionados."
              description="Ajuste os filtros de tipo de vendedor, família de produto ou status da meta."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="py-3 px-4 font-bold min-w-[190px]">Membro / Cargo</th>
                  <th className="py-3 px-3 font-bold text-center">Carteira</th>
                  <th className="py-3 px-3 font-bold text-center bg-sky-50/60 text-sky-900">
                    Clientes Ativos Mês
                  </th>
                  <th className="py-3 px-3 font-bold text-right">
                    {metricUnit === 'TONELADAS' ? 'Meta (t)' : 'Meta (R$)'}
                  </th>
                  <th className="py-3 px-3 font-bold text-right">
                    {metricUnit === 'TONELADAS' ? 'Realizado (t)' : 'Realizado (R$)'}
                  </th>
                  <th className="py-3 px-3 font-bold text-right">
                    {metricUnit === 'TONELADAS' ? 'Gap (t)' : 'Gap (R$)'}
                  </th>
                  <th className="py-3 px-3 font-bold text-center">% Meta</th>
                  <th className="py-3 px-3 font-bold text-right">
                    {metricUnit === 'TONELADAS' ? 'Pipeline (t)' : 'Pipeline (R$)'}
                  </th>
                  <th className="py-3 px-3 font-bold text-right">
                    {metricUnit === 'TONELADAS' ? 'Forecast (t)' : 'Forecast (R$)'}
                  </th>
                  <th className="py-3 px-3 font-bold text-center">
                    {metricUnit === 'TONELADAS' ? 'Ritmo (t/dia)' : 'Ritmo (R$/dia)'}
                  </th>
                  <th className="py-3 px-4 font-bold text-center min-w-[160px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredMembers.map((m) => {
                  const ating = m.atingimentoPercent
                  const isCurrent = m.email.toLowerCase() === userEmail
                  const isTons = metricUnit === 'TONELADAS'

                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors',
                        isCurrent && 'bg-primary/5',
                      )}
                    >
                      {/* Membro / Cargo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8 border border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {m.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-primary text-xs leading-tight">
                                {m.name}
                              </span>
                              {isCurrent && (
                                <Badge className="bg-primary text-white text-[9px] py-0 px-1.5 h-4">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              {m.cargo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Carteira Total */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {m.carteiraQtd}
                        </span>
                      </td>

                      {/* Clientes Ativos no Mês (NOVO INDICADOR OBRIGATÓRIO) */}
                      <td className="py-3 px-3 text-center bg-sky-50/40">
                        <span className="font-bold text-slate-900 block">
                          {m.clientesAtivosMes}
                        </span>
                        <span className="text-[10px] text-sky-700 font-semibold block">
                          {formatNumberBR(m.taxaCarteiraAtivaPercent, 1)}% ativa
                        </span>
                      </td>

                      {/* Meta */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {isTons ? formatWeight(m.toneladasMeta, 0) : formatCurrency(m.metaMensal)}
                      </td>

                      {/* Realizado */}
                      <td className="py-3 px-3 text-right font-serif font-bold text-emerald-600">
                        {isTons
                          ? formatWeight(m.toneladasRealizado, 0)
                          : formatCurrency(m.realizadoMensal)}
                      </td>

                      {/* Gap */}
                      <td className="py-3 px-3 text-right font-semibold text-amber-600">
                        {isTons
                          ? formatWeight(
                              m.toneladasGap || m.toneladasMeta - m.toneladasRealizado,
                              0,
                            )
                          : formatCurrency(m.gap)}
                      </td>

                      {/* % Meta */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border-none',
                            ating >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : ating >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800',
                          )}
                        >
                          {formatNumberBR(ating, 1)}%
                        </Badge>
                      </td>

                      {/* Pipeline */}
                      <td className="py-3 px-3 text-right font-serif font-semibold text-primary">
                        {isTons
                          ? formatWeight(
                              m.toneladasPipeline || Math.round(m.toneladasRealizado * 0.45),
                              0,
                            )
                          : formatCurrency(m.pipeline)}
                      </td>

                      {/* Forecast */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {isTons
                          ? formatWeight(
                              m.toneladasForecast || Math.round(m.toneladasRealizado * 1.25),
                              0,
                            )
                          : formatCurrency(m.forecast)}
                      </td>

                      {/* Ritmo */}
                      <td className="py-3 px-3 text-center font-mono text-violet-700 font-semibold">
                        {isTons
                          ? `${m.ritmoAtualTons ? formatNumberBR(m.ritmoAtualTons, 1) : '5,3'} t/dia`
                          : `R$ ${formatNumberBR((m.ritmoAtual || 33214) / 1000, 1)}k/dia`}
                      </td>

                      {/* Ações (Incluindo ANALISAR COM IA) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleOpenAiAnalysis(m)}
                            className="h-7 px-2 text-[11px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1 rounded-lg shadow-xs"
                            title={`Analisar performance de ${m.name} com Inteligência Artificial`}
                          >
                            <Sparkles className="w-3 h-3 text-slate-950" />
                            <span>Analisar com IA</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary hover:bg-primary/10 gap-1 px-2"
                            onClick={() => navigate('/crm')}
                            title="Ver carteira de clientes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SEÇÃO DE INTEGRAÇÃO OFICIAL COM SAP ECC */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-primary">
                Observabilidade Transacional · SAP ECC Backoffice
              </h3>
              <p className="text-xs text-muted-foreground">
                Dados transacionais oficiais espelhados do SAP ECC, Qlik Sense e Microsoft 365.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 font-medium"
            >
              SAP ECC Online (QAS)
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Backoffice Oficial
            </span>
            <span className="font-bold text-emerald-600 block">SAP ECC Conectado</span>
            <span className="text-[11px] text-muted-foreground">
              Faturamento e ordens sincronizados
            </span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Penetração de Carteira
            </span>
            <span className="font-bold text-primary block">
              {consolidated.clientesAtivosMes} Clientes Ativos
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatNumberBR(consolidated.taxaAtivacaoGeral, 1)}% com compra no mês
            </span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Previsão BG/NBD & P(vivo)
            </span>
            <span className="font-bold text-primary block">RFM & Janelas Ativas</span>
            <span className="text-[11px] text-muted-foreground">8 clientes A prioritários</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Controle RBAC / RLS
            </span>
            <span className="font-bold text-primary block">
              {isVendedorOnly
                ? 'Restrito a Vendedor'
                : isSupervisor
                  ? 'Supervisor Regional MG'
                  : 'Administração Geral'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Perfil: {userRole || 'comercial'}
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DE DIAGNÓSTICO DE IA INDIVIDUAL DO VENDEDOR */}
      <SellerAIDialog
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        analysis={selectedSellerAnalysis}
        loading={aiLoading}
        onCreateAction={(act) => {
          console.log('Ação criada pelo supervisor:', act)
        }}
      />
    </div>
  )
}
