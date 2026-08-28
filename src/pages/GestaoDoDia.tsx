import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  UserCheck,
  Calendar,
  Layers,
  PhoneCall,
  MessageSquare,
  Mail,
  MapPin,
  RefreshCw,
  Activity,
  Award,
  ArrowRight,
  Plus,
  Eye,
  Info,
} from 'lucide-react'
import {
  mockEquipe,
  mockClientes,
  mockFunilOportunidades,
  mockAcoesDoDia,
  mockVisitas,
  mockCadenciaData,
  mockLatenciaData,
  type MembroEquipe,
} from '@/data/mockCommercialData'
import { CommercialPaceThermometer } from '@/components/shared/CommercialPaceThermometer'
import { SecondaryTargetAxisChart } from '@/components/shared/SecondaryTargetAxisChart'
import { AIGapExplainerPanel } from '@/components/shared/AIGapExplainerPanel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function GestaoDoDia() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState('mes')
  const [activeTab, setActiveTab] = useState('geral')

  // Estado para Drill-down do vendedor
  const [selectedSeller, setSelectedSeller] = useState<MembroEquipe | null>(null)
  const [drilldownModalOpen, setDrilldownModalOpen] = useState(false)

  // Ação criada via alerta
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionData, setActionData] = useState({
    title: '',
    seller: '',
    priority: 'Alta',
    dueDate: 'Hoje',
  })

  // Métricas Consolidadas do Supervisor
  const kpis = useMemo(() => {
    return {
      metaMensal: 2500000,
      realizadoMensal: 1875000,
      gap: 625000,
      atingimento: 75.0,
      metaToneladas: 850,
      realizadoToneladas: 637,
      gapToneladas: 213,
      metaAnual: 30000000,
      realizadoAnual: 9375000,
      forecastMensal: 2250000,
      pipelineAberto: 1200000,
      pipelinePonderado: 720000,
      coberturaMeta: 125, // %
      // Execução
      acoesPlanejadas: 24,
      acoesConcluidas: 18,
      acoesPendentes: 4,
      acoesVencidas: 2,
      visitasPlanejadas: 12,
      visitasRealizadas: 8,
      // Carteira
      clientesAtivos: 25,
      clientesEmRisco: 4,
      clientesRecompra: 6,
      clientesInativos: 3,
      clientesReativadosMes: 2,
      // Funil
      totalOportunidades: 20,
      cotacoesQtd: 8,
      cotacoesValor: 420000,
      negociacoesQtd: 5,
      negociacoesValor: 310000,
      pedidosQtd: 3,
      pedidosValor: 185000,
      // Ritmo
      diasUteisPassados: 14,
      diasUteisRestantes: 8,
      ritmoAtualDia: 133928, // 1875000 / 14
      ritmoNecessarioDia: 78125, // 625000 / 8
      ritmoAtualTonsDia: 45.5,
      ritmoNecessarioTonsDia: 26.6,
    }
  }, [])

  const handleOpenDrilldown = (seller: MembroEquipe) => {
    setSelectedSeller(seller)
    setDrilldownModalOpen(true)
  }

  const handleCreateActionFromAlert = (title: string, sellerName: string) => {
    setActionData({
      title,
      seller: sellerName,
      priority: 'Alta',
      dueDate: 'Hoje',
    })
    setActionModalOpen(true)
  }

  const handleConfirmAction = () => {
    setActionModalOpen(false)
    toast.success('Ação de intervenção criada com sucesso!', {
      description: `Atribuída para ${actionData.seller}. Notificação enviada. Origem: AI_SUPERVISOR_RECOMMENDATION`,
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageLoadingState message="Carregando Dashboard do Supervisor CIAFAL..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageErrorState
          title="Erro ao carregar Dashboard do Supervisor."
          description={error}
          onRetry={() => {
            setError(null)
            setLoading(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* CABEÇALHO DO SUPERVISOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Gestão do Dia & Painel do Supervisor
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300"
                >
                  Supervisão Regional CIAFAL
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-0.5">
                Monitoramento em tempo real de metas, ritmo, funil, visitas presenciais, cadência e
                latência da equipe.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/kpis')}
            className="h-9 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-xs"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ver Cockpit Executivo</span>
          </Button>

          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-9 w-36 text-xs rounded-xl">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Mês Atual (Outubro)</SelectItem>
              <SelectItem value="ano">Ano 2024</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoading(true)
              setTimeout(() => {
                setLoading(false)
                toast.success('Métricas atualizadas com o SAP ECC!')
              }, 300)
            }}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar Dados
          </Button>
        </div>
      </div>

      {/* ALERTAS INTELIGENTES DO SUPERVISOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 text-white p-3.5 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" /> Projeção de Fechamento
          </div>
          <p className="text-xs text-slate-200 font-medium">
            Ritmo atual projeta fechamento em <strong>89%</strong> da meta mensal com base no
            histórico de dias úteis.
          </p>
          <div className="text-[10px] text-emerald-300 font-semibold flex items-center justify-between pt-1 border-t border-white/10">
            <span>Forecast: R$ 2.25M</span>
            <span>+14% vs mês anterior</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-500/30 text-white p-3.5 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Alerta de Gap / Funil
          </div>
          <p className="text-xs text-slate-200 font-medium">
            Pipeline ponderado (<strong>R$ 720k</strong>) cobre o Gap (<strong>R$ 625k</strong>),
            mas exige aceleração de cotações em 48h.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              handleCreateActionFromAlert(
                'Acelerar follow-up de propostas abertas com vendedor',
                'Carlos Mendonça',
              )
            }
            className="h-6 text-[10px] text-amber-300 hover:text-white p-0 justify-start"
          >
            + Criar ação para equipe
          </Button>
        </div>

        <div className="bg-gradient-to-br from-rose-950 to-slate-900 border border-rose-500/30 text-white p-3.5 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" /> Latência em Cotações
          </div>
          <p className="text-xs text-slate-200 font-medium">
            Existem <strong>R$ 420 mil</strong> em 8 cotações sem follow-up há mais de 48h (João
            Pedro e Carlos).
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              handleCreateActionFromAlert(
                'Realizar follow-up imediato de 8 cotações estagnadas',
                'João Pedro',
              )
            }
            className="h-6 text-[10px] text-rose-300 hover:text-white p-0 justify-start"
          >
            + Cobrar follow-up
          </Button>
        </div>

        <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-500/30 text-white p-3.5 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" /> Janela de Recompra
          </div>
          <p className="text-xs text-slate-200 font-medium">
            <strong>3 clientes prioritários</strong> (Metais Betim, Usinagem Vale e Santa Rita)
            estão fora da frequência normal de recompra.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inativos')}
            className="h-6 text-[10px] text-blue-300 hover:text-white p-0 justify-start"
          >
            Ver Gestão de Carteira →
          </Button>
        </div>
      </div>

      {/* KPIS GERAIS DO TOPO (CARDS COMPLETOS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Card 1: Meta Mensal R$ */}
        <Card className="p-3.5 rounded-2xl border bg-white/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Meta Mensal Equipe
          </span>
          <span className="font-serif text-xl font-bold text-primary mt-1">R$ 2.500.000</span>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Realizado: R$ 1.875k</span>
              <strong className="text-emerald-600">75%</strong>
            </div>
            <Progress value={75} className="h-1.5" />
          </div>
        </Card>

        {/* Card 2: Gap R$ */}
        <Card className="p-3.5 rounded-2xl border bg-white/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Gap Financeiro
          </span>
          <span className="font-serif text-xl font-bold text-amber-700 mt-1">R$ 625.000</span>
          <span className="text-[10px] text-muted-foreground block mt-2">
            Faltam <strong>8 dias úteis</strong> no mês
          </span>
        </Card>

        {/* Card 3: Meta Toneladas */}
        <Card className="p-3.5 rounded-2xl border bg-white/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Volume / Toneladas
          </span>
          <span className="font-serif text-xl font-bold text-slate-900 mt-1">637t / 850t</span>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Faltam 213t</span>
              <strong className="text-primary">74.9%</strong>
            </div>
            <Progress value={74.9} className="h-1.5" />
          </div>
        </Card>

        {/* Card 4: Meta Anual */}
        <Card className="p-3.5 rounded-2xl border bg-white/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Meta Anual 2024
          </span>
          <span className="font-serif text-xl font-bold text-primary mt-1">R$ 30.000.000</span>
          <span className="text-[10px] text-muted-foreground block mt-2">
            Realizado YTD: <strong>R$ 9.375.000</strong>
          </span>
        </Card>

        {/* Card 5: Pipeline & Ponderado */}
        <Card className="p-3.5 rounded-2xl border bg-white/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Pipeline Ponderado
          </span>
          <span className="font-serif text-xl font-bold text-emerald-700 mt-1">R$ 720.000</span>
          <span className="text-[10px] text-muted-foreground block mt-2">
            Aberto total: <strong>R$ 1.200.000</strong>
          </span>
        </Card>

        {/* Card 6: Cobertura da Meta */}
        <Card className="p-3.5 rounded-2xl border bg-white/90 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Cobertura da Meta
          </span>
          <span className="font-serif text-xl font-bold text-primary mt-1">125%</span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-2">
            Forecast: <strong>R$ 2.250.000</strong>
          </span>
        </Card>
      </div>

      {/* SEÇÕES DE ANÁLISE: EXECUÇÃO, CARTEIRA E FUNIL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SEÇÃO 1: EXECUÇÃO */}
        <Card className="p-4 rounded-2xl border border-border/60 bg-white/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-serif font-bold text-sm text-primary">Execução & Atividades</h3>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              24 Ações Totais
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px]">Ações Concluídas</span>
              <strong className="text-emerald-700 text-base">{kpis.acoesConcluidas}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px]">Ações Pendentes</span>
              <strong className="text-amber-700 text-base">{kpis.acoesPendentes}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px]">Ações Vencidas</span>
              <strong className="text-rose-700 text-base">{kpis.acoesVencidas}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-border/40">
              <span className="text-muted-foreground block text-[10px]">Visitas Realizadas</span>
              <strong className="text-primary text-base">
                {kpis.visitasRealizadas} / {kpis.visitasPlanejadas}
              </strong>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/visitas')}
            className="w-full h-8 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" /> Ver Módulo de Visitas Presenciais →
          </Button>
        </Card>

        {/* SEÇÃO 2: CARTEIRA */}
        <Card className="p-4 rounded-2xl border border-border/60 bg-white/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <h3 className="font-serif font-bold text-sm text-primary">Saúde da Carteira</h3>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              25 Clientes Gerenciados
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
              <span className="text-emerald-800 block text-[10px] font-semibold">
                Ativos Regulares
              </span>
              <strong className="text-emerald-800 text-base">{kpis.clientesAtivos}</strong>
            </div>
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
              <span className="text-amber-800 block text-[10px] font-semibold">
                Em Risco de Perda
              </span>
              <strong className="text-amber-800 text-base">{kpis.clientesEmRisco}</strong>
            </div>
            <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60">
              <span className="text-blue-800 block text-[10px] font-semibold">Janela Recompra</span>
              <strong className="text-blue-800 text-base">{kpis.clientesRecompra}</strong>
            </div>
            <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-200/60">
              <span className="text-purple-800 block text-[10px] font-semibold">
                Reativados no Mês
              </span>
              <strong className="text-purple-800 text-base">+{kpis.clientesReativadosMes}</strong>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/inativos')}
            className="w-full h-8 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Abrir Gestão de Carteira 360º →
          </Button>
        </Card>

        {/* SEÇÃO 3: FUNIL DE VENDAS */}
        <Card className="p-4 rounded-2xl border border-border/60 bg-white/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-serif font-bold text-sm text-primary">Estágios do Funil</h3>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              20 Oportunidades
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-xl border border-border/40 text-center">
              <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                Cotações
              </span>
              <strong className="text-primary text-sm block">8</strong>
              <span className="text-[10px] text-muted-foreground">R$ 420k</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-border/40 text-center">
              <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                Negociações
              </span>
              <strong className="text-amber-700 text-sm block">5</strong>
              <span className="text-[10px] text-muted-foreground">R$ 310k</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-border/40 text-center">
              <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                Pedidos
              </span>
              <strong className="text-emerald-700 text-sm block">3</strong>
              <span className="text-[10px] text-muted-foreground">R$ 185k</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm')}
            className="w-full h-8 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" /> Acessar Funil Kanban Completo →
          </Button>
        </Card>
      </div>

      {/* SEÇÃO DE ANÁLISES DE PERFORMANCE: RITMO, CADÊNCIA E LATÊNCIA */}
      <Card className="p-5 rounded-2xl border border-border/60 bg-white/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-primary">
              Análises de Performance & Eficiência Comercial
            </h3>
            <p className="text-xs text-muted-foreground">
              Diagnóstico de ritmo financeiro/toneladas, distribuição por canal de contato e SLAs de
              tempo entre etapas.
            </p>
          </div>
        </div>

        {/* TERMÔMETRO CORPORATIVO DE RITMO COMERCIAL (NOVO PADRÃO CIAFAL) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CommercialPaceThermometer
            title="Ritmo em Toneladas (Equipe Vendas)"
            ritmoAtual={kpis.ritmoAtualTonsDia}
            ritmoNecessario={kpis.ritmoNecessarioTonsDia}
            unidade="t/dia"
            diasUteisPassados={kpis.diasUteisPassados}
            diasUteisRestantes={kpis.diasUteisRestantes}
            realizadoVolume={kpis.realizadoToneladas}
            metaVolume={kpis.metaToneladas}
            gapVolume={kpis.gapToneladas}
          />
          <CommercialPaceThermometer
            title="Ritmo Financeiro R$ (Supervisão)"
            ritmoAtual={kpis.ritmoAtualDia}
            ritmoNecessario={kpis.ritmoNecessarioDia}
            unidade="R$/dia"
            diasUteisPassados={kpis.diasUteisPassados}
            diasUteisRestantes={kpis.diasUteisRestantes}
            isSupervisor={true}
          />
        </div>

        {/* DIAGNÓSTICO DE GAP POR IA EXPLICATIVA */}
        <AIGapExplainerPanel gapTons={kpis.gapToneladas} gapBrl={kpis.gap} confidence={96} />

        {/* CADÊNCIA COMERCIAL E LATÊNCIA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* TABELA CADÊNCIA */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-xs text-primary flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> Cadência Comercial por Canal
            </h4>
            <div className="border border-border/40 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="text-left p-2">Canal</th>
                    <th className="text-center p-2">Qtd</th>
                    <th className="text-left p-2">Resultados Gerados</th>
                    <th className="text-right p-2">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {mockCadenciaData.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-semibold text-slate-800">{c.canal}</td>
                      <td className="p-2 text-center font-mono">{c.quantidade}</td>
                      <td className="p-2 text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {c.resultadosGerados}
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-700">
                        {c.taxaConversao}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABELA LATÊNCIA */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-xs text-primary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Latência Médio entre Etapas (SLAs)
            </h4>
            <div className="border border-border/40 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="text-left p-2">Etapa do Funil</th>
                    <th className="text-center p-2">Tempo Médio</th>
                    <th className="text-center p-2">SLA Esperado</th>
                    <th className="text-right p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {mockLatenciaData.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-semibold text-slate-800">{l.etapa}</td>
                      <td className="p-2 text-center font-mono font-bold text-slate-700">
                        {l.tempoMedio}
                      </td>
                      <td className="p-2 text-center text-[11px] text-muted-foreground">
                        {l.slaEsperado}
                      </td>
                      <td className="p-2 text-right">
                        <Badge
                          className={cn(
                            'text-[9px] font-bold border-none',
                            l.status === 'normal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800',
                          )}
                        >
                          {l.status === 'normal' ? 'No Prazo' : 'Atenção'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* VISÃO INDIVIDUAL DA EQUIPE (TABELA DE VENDEDORES COM DRILL-DOWN) */}
      <Card className="p-5 rounded-2xl border border-border/60 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-primary">
              Visão Individual & Desempenho dos Vendedores
            </h3>
            <p className="text-xs text-muted-foreground">
              Clique sobre um membro da equipe para abrir o drill-down com Meu Dia, Gestão de
              Carteira, Funil e Visitas do vendedor.
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            5 Consultores Ativos
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] text-muted-foreground uppercase border-b">
              <tr>
                <th className="text-left p-2.5">Vendedor / Consultor</th>
                <th className="text-right p-2.5">Meta</th>
                <th className="text-right p-2.5">Realizado</th>
                <th className="text-center p-2.5">% Ating.</th>
                <th className="text-right p-2.5">Gap</th>
                <th className="text-right p-2.5">Forecast</th>
                <th className="text-right p-2.5">Ritmo Atual</th>
                <th className="text-right p-2.5">Ritmo Nec.</th>
                <th className="text-right p-2.5">Pipeline Pond.</th>
                <th className="text-center p-2.5">Conversão</th>
                <th className="text-center p-2.5">Tendência</th>
                <th className="text-center p-2.5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {mockEquipe.map((vendedor) => {
                const isUnderperforming = vendedor.atingimentoPercent < 70

                return (
                  <tr
                    key={vendedor.id}
                    onClick={() => handleOpenDrilldown(vendedor)}
                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <td className="p-2.5 font-bold text-primary flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-serif font-bold flex items-center justify-center shrink-0">
                        {vendedor.name[0]}
                      </div>
                      <div>
                        <span className="hover:underline">{vendedor.name}</span>
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          {vendedor.cargo}
                        </span>
                      </div>
                    </td>

                    <td className="p-2.5 text-right font-mono text-muted-foreground">
                      R$ {(vendedor.metaMensal / 1000).toFixed(0)}k
                    </td>

                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                      R$ {(vendedor.realizadoMensal / 1000).toFixed(0)}k
                    </td>

                    <td className="p-2.5 text-center">
                      <Badge
                        className={cn(
                          'text-[10px] font-bold border-none',
                          vendedor.atingimentoPercent >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : vendedor.atingimentoPercent >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800',
                        )}
                      >
                        {vendedor.atingimentoPercent}%
                      </Badge>
                    </td>

                    <td className="p-2.5 text-right font-mono text-amber-700 font-semibold">
                      R$ {(vendedor.gap / 1000).toFixed(0)}k
                    </td>

                    <td className="p-2.5 text-right font-mono text-slate-700">
                      R$ {(vendedor.forecast / 1000).toFixed(0)}k
                    </td>

                    <td className="p-2.5 text-right font-mono text-emerald-700">
                      R$ {((vendedor.ritmoAtual || 0) / 1000).toFixed(0)}k/d
                    </td>

                    <td className="p-2.5 text-right font-mono text-primary font-semibold">
                      R$ {((vendedor.ritmoNecessario || 0) / 1000).toFixed(0)}k/d
                    </td>

                    <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                      R$ {((vendedor.pipelinePonderado || 0) / 1000).toFixed(0)}k
                    </td>

                    <td className="p-2.5 text-center font-bold text-slate-700">
                      {vendedor.conversaoPercent}%
                    </td>

                    <td className="p-2.5 text-center">
                      <Badge
                        className={cn(
                          'text-[9px] font-bold border-none',
                          vendedor.tendenciaStatus === 'ACIMA DA META'
                            ? 'bg-emerald-600 text-white'
                            : vendedor.tendenciaStatus === 'NA TRAJETÓRIA'
                              ? 'bg-blue-100 text-blue-800'
                              : vendedor.tendenciaStatus === 'EM RISCO'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-600 text-white',
                        )}
                      >
                        {vendedor.tendenciaStatus || 'NA TRAJETÓRIA'}
                      </Badge>
                    </td>

                    <td className="p-2.5 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDrilldown(vendedor)
                        }}
                        className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1 font-semibold"
                      >
                        Drill-down <ChevronRight className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DE DRILL-DOWN DO VENDEDOR */}
      <Dialog open={drilldownModalOpen} onOpenChange={setDrilldownModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-serif font-bold text-lg flex items-center justify-center">
                  {selectedSeller?.name[0]}
                </div>
                <div>
                  <DialogTitle className="font-serif text-lg text-primary">
                    {selectedSeller?.name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedSeller?.cargo} · Carteira: {selectedSeller?.carteiraQtd} clientes ·{' '}
                    {selectedSeller?.email}
                  </DialogDescription>
                </div>
              </div>

              <Badge
                className={cn(
                  'text-xs font-bold border-none px-3 py-1',
                  selectedSeller?.tendenciaStatus === 'ACIMA DA META'
                    ? 'bg-emerald-600 text-white'
                    : selectedSeller?.tendenciaStatus === 'NA TRAJETÓRIA'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-600 text-white',
                )}
              >
                {selectedSeller?.tendenciaStatus || 'NA TRAJETÓRIA'}
              </Badge>
            </div>
          </DialogHeader>

          {selectedSeller && (
            <div className="space-y-4 py-2">
              {/* KPIS RÁPIDOS DO VENDEDOR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Meta vs Realizado
                  </span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">
                    R$ {(selectedSeller.realizadoMensal / 1000).toFixed(0)}k /{' '}
                    {(selectedSeller.metaMensal / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {selectedSeller.atingimentoPercent}% da meta
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Gap a Cobrir
                  </span>
                  <span className="text-sm font-bold text-amber-700 block mt-0.5">
                    R$ {(selectedSeller.gap / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Ritmo nec.: R$ {((selectedSeller.ritmoNecessario || 0) / 1000).toFixed(0)}k/dia
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Pipeline Ponderado
                  </span>
                  <span className="text-sm font-bold text-primary block mt-0.5">
                    R$ {((selectedSeller.pipelinePonderado || 0) / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Total aberto: R$ {(selectedSeller.pipeline / 1000).toFixed(0)}k
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Visitas & Ações
                  </span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">
                    {selectedSeller.visitasMes} visitas / {selectedSeller.acoesPendentes} ações
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Cadência: {selectedSeller.cadenciaScore || 'Alta'}
                  </span>
                </div>
              </div>

              {/* ABAS INTERNAS DO DRILL-DOWN */}
              <Tabs defaultValue="acoes" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl w-full justify-start gap-1">
                  <TabsTrigger value="acoes" className="text-xs rounded-lg font-semibold">
                    Meu Dia ({selectedSeller.acoesPendentes} Ações)
                  </TabsTrigger>
                  <TabsTrigger value="visitas" className="text-xs rounded-lg font-semibold">
                    Visitas ({selectedSeller.visitasMes})
                  </TabsTrigger>
                  <TabsTrigger value="oportunidades" className="text-xs rounded-lg font-semibold">
                    Funil & Oportunidades
                  </TabsTrigger>
                  <TabsTrigger value="clientes" className="text-xs rounded-lg font-semibold">
                    Clientes em Risco
                  </TabsTrigger>
                </TabsList>

                {/* ABA: MEU DIA DO SUBORDINADO */}
                <TabsContent value="acoes" className="space-y-2 mt-3 text-xs">
                  {mockAcoesDoDia
                    .filter((a) => a.status !== 'concluida')
                    .slice(0, 4)
                    .map((acao) => (
                      <div
                        key={acao.id}
                        className="p-2.5 rounded-xl border border-border/60 bg-white flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={cn(
                                'text-[9px] font-bold border-none uppercase',
                                acao.urgencia === 'urgente'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800',
                              )}
                            >
                              {acao.urgencia}
                            </Badge>
                            <span className="font-bold text-slate-800">{acao.clienteNome}</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">{acao.recomendacao}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDrilldownModalOpen(false)
                            navigate(`/crm/${acao.clienteId}`)
                          }}
                          className="h-7 text-[11px] text-primary"
                        >
                          Ver Cliente 360º
                        </Button>
                      </div>
                    ))}
                </TabsContent>

                {/* ABA: VISITAS DO VENDEDOR */}
                <TabsContent value="visitas" className="space-y-2 mt-3 text-xs">
                  {mockVisitas
                    .filter(
                      (v) =>
                        v.user_id === selectedSeller.userId || selectedSeller.role === 'SUPERVISOR',
                    )
                    .slice(0, 4)
                    .map((visit) => (
                      <div
                        key={visit.id}
                        className="p-2.5 rounded-xl border border-border/60 bg-white flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={cn(
                                'text-[9px] font-bold border-none',
                                visit.type === 'COMMERCIAL_VISIT'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-amber-100 text-amber-800',
                              )}
                            >
                              {visit.type === 'COMMERCIAL_VISIT' ? 'Comercial' : 'Técnica'}
                            </Badge>
                            <span className="font-bold text-slate-800">{visit.customer_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              ({visit.planned_date} às {visit.planned_time})
                            </span>
                          </div>
                          <p className="text-muted-foreground text-[11px] line-clamp-1">
                            {visit.objective}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                          {visit.status}
                        </Badge>
                      </div>
                    ))}
                </TabsContent>

                {/* ABA: OPORTUNIDADES */}
                <TabsContent value="oportunidades" className="space-y-2 mt-3 text-xs">
                  {mockFunilOportunidades
                    .filter(
                      (o) =>
                        o.vendedorNome === selectedSeller.name ||
                        selectedSeller.role === 'SUPERVISOR',
                    )
                    .slice(0, 4)
                    .map((op) => (
                      <div
                        key={op.id}
                        className="p-2.5 rounded-xl border border-border/60 bg-white flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{op.titulo}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {op.clienteNome} · R$ {op.valor.toLocaleString('pt-BR')} ({op.toneladas}
                            t)
                          </span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                          {op.etapa}
                        </Badge>
                      </div>
                    ))}
                </TabsContent>

                {/* ABA: CLIENTES EM RISCO */}
                <TabsContent value="clientes" className="space-y-2 mt-3 text-xs">
                  {mockClientes
                    .filter((c) => c.statusComercial === 'Em Risco')
                    .slice(0, 3)
                    .map((cli) => (
                      <div
                        key={cli.id}
                        className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-rose-900 block">{cli.razaoSocial}</span>
                          <span className="text-[10px] text-rose-700">
                            {cli.diasSemContato} dias sem contato · Faturamento R${' '}
                            {cli.faturamento12m.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setDrilldownModalOpen(false)
                            navigate(`/crm/${cli.id}`)
                          }}
                          className="h-7 text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                        >
                          Intervir Agora
                        </Button>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDrilldownModalOpen(false)}>
              Fechar Drill-down
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CRIAÇÃO DE AÇÃO DE INTERVENÇÃO */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Criar Ação de Intervenção</DialogTitle>
            <DialogDescription>Ação recomendada pelo Sales Supervisor Agent.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Título da Ação
              </label>
              <input
                type="text"
                value={actionData.title}
                onChange={(e) => setActionData({ ...actionData, title: e.target.value })}
                className="w-full h-9 rounded-md border border-input px-3 py-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={actionData.seller}
                  onChange={(e) => setActionData({ ...actionData, seller: e.target.value })}
                  className="w-full h-9 rounded-md border border-input px-3 py-1 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Prioridade</label>
                <Select
                  value={actionData.priority}
                  onValueChange={(val) => setActionData({ ...actionData, priority: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900">
              <strong>Nota de Auditoria:</strong> A ação será registrada com a origem{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">
                AI_SUPERVISOR_RECOMMENDATION
              </code>{' '}
              e aparecerá no Meu Dia do consultor.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAction} className="bg-primary text-white font-semibold">
              Confirmar & Criar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
